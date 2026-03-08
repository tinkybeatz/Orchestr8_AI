export interface Checkpoint {
  readonly runId: string;
  readonly stepIndex: number;
  readonly state: Record<string, unknown>;
  readonly createdAt: Date;
}

export interface OutboxEntry {
  readonly id: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly correlationId: string;
  readonly createdAt: Date;
}

export interface StateStorePort {
  saveCheckpointAndOutbox(
    checkpoint: Omit<Checkpoint, 'createdAt'>,
    events: Omit<OutboxEntry, 'id' | 'createdAt'>[],
  ): Promise<void>;

  loadCheckpoint(runId: string): Promise<Checkpoint | null>;

  fetchPendingOutbox(limit: number): Promise<OutboxEntry[]>;

  markDispatched(outboxIds: string[]): Promise<void>;
}
