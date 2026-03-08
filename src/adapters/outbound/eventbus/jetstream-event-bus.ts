import {
  connect,
  type NatsConnection,
  type JetStreamClient,
  type JetStreamManager,
  type ConsumerConfig,
  AckPolicy,
  DeliverPolicy,
  headers,
} from 'nats';
import type {
  EventBusPort,
  EventEnvelope,
  ConsumedEvent,
  EventHandler,
} from '../../../application/ports/outbound/event-bus.port.js';
import { orchestrationStreamConfig, deadLetterStreamConfig } from './jetstream-stream-config.js';
import { routeToDeadLetter } from './dead-letter-handler.js';

const MAX_DELIVER_DEFAULT = 5;

export class JetStreamEventBus implements EventBusPort {
  private nc: NatsConnection | null = null;
  private js: JetStreamClient | null = null;
  private jsm: JetStreamManager | null = null;

  constructor(private readonly natsUrl: string) {}

  async connect(): Promise<void> {
    this.nc = await connect({ servers: this.natsUrl });
    this.js = this.nc.jetstream();
    this.jsm = await this.nc.jetstreamManager();

    // Ensure streams exist
    await this.ensureStream(orchestrationStreamConfig());
    await this.ensureStream(deadLetterStreamConfig());
  }

  private async ensureStream(
    config: ReturnType<typeof orchestrationStreamConfig>,
  ): Promise<void> {
    try {
      await this.jsm!.streams.info(config.name!);
      // Stream exists — update it so subject changes take effect
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await this.jsm!.streams.update(config.name!, config as any);
    } catch {
      // Stream doesn't exist yet — create it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await this.jsm!.streams.add(config as any);
    }
  }

  async publish(envelope: EventEnvelope): Promise<void> {
    if (!this.js) throw new Error('Not connected. Call connect() first.');

    const hdrs = headers();
    if (envelope.headers) {
      for (const [k, v] of Object.entries(envelope.headers)) {
        hdrs.set(k, v);
      }
    }

    await this.js.publish(envelope.subject, envelope.data, {
      headers: hdrs,
      msgID: envelope.msgId, // JetStream dedup via Nats-Msg-Id
    });
  }

  async subscribe(
    subject: string,
    durableName: string,
    handler: EventHandler,
  ): Promise<{ unsubscribe: () => Promise<void> }> {
    if (!this.jsm || !this.js || !this.nc) {
      throw new Error('Not connected. Call connect() first.');
    }

    // Ensure consumer exists
    const streamName = this.resolveStreamName(subject);
    const consumerConfig: Partial<ConsumerConfig> = {
      durable_name: durableName,
      filter_subject: subject,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      ack_wait: 30_000_000_000, // 30s in nanoseconds
      max_deliver: MAX_DELIVER_DEFAULT,
      max_ack_pending: 100,
    };

    try {
      await this.jsm.consumers.info(streamName, durableName);
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      await this.jsm.consumers.add(streamName, consumerConfig as any);
    }

    const consumer = await this.js.consumers.get(streamName, durableName);
    const messages = await consumer.consume();

    const processLoop = (async (): Promise<void> => {
      for await (const msg of messages) {
        const consumedEvent: ConsumedEvent = {
          subject: msg.subject,
          data: msg.data,
          headers: this.extractHeaders(msg),
          seq: msg.seq,
          ack: () => msg.ack(),
          nak: (delayMs?: number) => msg.nak(delayMs),
        };

        try {
          await handler(consumedEvent);
        } catch (err) {
          // Check if max deliveries reached
          if (msg.info.redeliveryCount >= MAX_DELIVER_DEFAULT - 1) {
            await routeToDeadLetter(this.js!, this.jsm!, {
              originalSubject: msg.subject,
              failureReason: err instanceof Error ? err.message : String(err),
              deliveryCount: msg.info.redeliveryCount + 1,
              lastAttempt: new Date().toISOString(),
            }, msg.data);
            msg.ack(); // Ack to stop redelivery
          } else {
            msg.nak(1000); // Retry after 1s
          }
        }
      }
    })();

    // Fire and forget the process loop — it runs until unsubscribed
    processLoop.catch((err) => {
      if (String(err).includes('consumer deleted') ||
          String(err).includes('iterator closed')) {
        return; // Expected on shutdown
      }
      console.error(`[JetStreamEventBus] Consumer error: ${String(err)}`);
    });

    return {
      unsubscribe: () => {
        messages.stop();
        return Promise.resolve();
      },
    };
  }

  async close(): Promise<void> {
    if (this.nc) {
      await this.nc.drain();
      this.nc = null;
      this.js = null;
      this.jsm = null;
    }
  }

  private resolveStreamName(subject: string): string {
    if (subject.startsWith('orchestr8ai.dlq.')) return 'DEAD_LETTER';
    return 'ORCHESTRATION'; // orchestr8ai.discord.> and any other non-dlq subjects
  }

  private extractHeaders(
    msg: { headers?: { get: (key: string) => string } },
  ): Record<string, string> {
    const result: Record<string, string> = {};
    if (!msg.headers) return result;
    // NATS headers don't expose iteration easily, return empty for now
    return result;
  }
}
