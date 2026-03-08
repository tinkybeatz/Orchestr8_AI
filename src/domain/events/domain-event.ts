export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly correlationId: string;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
}
