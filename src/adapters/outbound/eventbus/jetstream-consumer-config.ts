/**
 * Consumer configurations for JetStream.
 * DBS-102-R04: explicit ack, durable consumers, bounded retries.
 */

export interface ConsumerOpts {
  durableName: string;
  filterSubject: string;
  ackWaitMs: number;
  maxDeliver: number;
  maxAckPending: number;
}

export function outboxProcessorConsumer(): ConsumerOpts {
  return {
    durableName: 'outbox-processor',
    filterSubject: 'joe.orchestration.>',
    ackWaitMs: 30_000,
    maxDeliver: 5,
    maxAckPending: 100,
  };
}

export function analyticsFanoutConsumer(): ConsumerOpts {
  return {
    durableName: 'analytics-fanout',
    filterSubject: 'joe.orchestration.>',
    ackWaitMs: 60_000,
    maxDeliver: 3,
    maxAckPending: 200,
  };
}
