export interface EventEnvelope {
  readonly subject: string;
  readonly data: Uint8Array;
  readonly headers?: Record<string, string>;
  readonly msgId?: string;
}

export interface ConsumedEvent {
  readonly subject: string;
  readonly data: Uint8Array;
  readonly headers: Record<string, string>;
  readonly seq: number;
  ack(): void;
  nak(delayMs?: number): void;
}

export type EventHandler = (event: ConsumedEvent) => Promise<void>;

export interface EventBusPort {
  publish(envelope: EventEnvelope): Promise<void>;

  subscribe(
    subject: string,
    durableName: string,
    handler: EventHandler,
  ): Promise<{ unsubscribe: () => Promise<void> }>;

  close(): Promise<void>;
}
