export interface AiMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface N8nMcpConfig {
  readonly apiUrl: string;
  readonly apiKey: string;
}

export interface AiRunOptions {
  readonly system: string;
  readonly messages: ReadonlyArray<AiMessage>;
  readonly tools?: Record<string, unknown>;
  readonly n8nConfig?: N8nMcpConfig;
  readonly maxSteps?: number;
}

export interface AiAgentPort {
  run(options: AiRunOptions): Promise<string>;
}
