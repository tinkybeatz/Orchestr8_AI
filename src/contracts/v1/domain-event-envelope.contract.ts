import type { VersionedPayload } from '../versioning.js';
import { wrapPayload, validateVersion } from '../versioning.js';

export interface DomainEventEnvelopeV1 {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
}

export const DOMAIN_EVENT_ENVELOPE_TYPE = 'domain.event.envelope';
export const DOMAIN_EVENT_ENVELOPE_VERSION = 1;

export function wrapDomainEventEnvelope(
  data: DomainEventEnvelopeV1,
): VersionedPayload<DomainEventEnvelopeV1> {
  return wrapPayload(DOMAIN_EVENT_ENVELOPE_TYPE, DOMAIN_EVENT_ENVELOPE_VERSION, data);
}

export function validateDomainEventEnvelope(
  payload: VersionedPayload<DomainEventEnvelopeV1>,
): void {
  validateVersion(payload, DOMAIN_EVENT_ENVELOPE_TYPE, DOMAIN_EVENT_ENVELOPE_VERSION);
}
