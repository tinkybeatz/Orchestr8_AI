import type { JetStreamClient, JetStreamManager } from 'nats';
import { headers, StringCodec } from 'nats';

const sc = StringCodec();

export interface DeadLetterMeta {
  originalSubject: string;
  failureReason: string;
  deliveryCount: number;
  lastAttempt: string;
}

/**
 * Routes a failed message to the DLQ stream.
 * Preserves original subject as joe.dlq.{originalSubject}
 * and attaches replay metadata as headers.
 */
export async function routeToDeadLetter(
  js: JetStreamClient,
  _jsm: JetStreamManager,
  meta: DeadLetterMeta,
  data: Uint8Array,
): Promise<void> {
  const dlqSubject = `bob.dlq.${meta.originalSubject}`;
  const hdrs = headers();
  hdrs.set('X-DLQ-Original-Subject', meta.originalSubject);
  hdrs.set('X-DLQ-Failure-Reason', meta.failureReason);
  hdrs.set('X-DLQ-Delivery-Count', String(meta.deliveryCount));
  hdrs.set('X-DLQ-Last-Attempt', meta.lastAttempt);

  await js.publish(dlqSubject, data, { headers: hdrs });
  console.warn(
    `[DLQ] Routed to ${dlqSubject}: ${meta.failureReason} (deliveries: ${meta.deliveryCount})`,
  );
}

export function encodePayload(payload: Record<string, unknown>): Uint8Array {
  return sc.encode(JSON.stringify(payload));
}

export function decodePayload(data: Uint8Array): Record<string, unknown> {
  return JSON.parse(sc.decode(data)) as Record<string, unknown>;
}
