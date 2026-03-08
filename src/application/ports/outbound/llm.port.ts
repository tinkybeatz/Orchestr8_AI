export type TextBlock = { readonly type: 'text'; readonly text: string };
export type ToolUseBlock = {
  readonly type: 'tool_use';
  readonly id: string;
  readonly name: string;
  readonly input: Record<string, unknown>;
};
export type ToolResultBlock = {
  readonly type: 'tool_result';
  readonly toolUseId: string;
  readonly content: string;
};

export type MessageBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface LLMMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string | readonly MessageBlock[];
}

export interface LLMTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

export interface LLMResponse {
  readonly content: string;
  readonly finishReason: 'stop' | 'length' | 'tool_use';
  readonly toolCalls?: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly input: Record<string, unknown>;
  }>;
  readonly usage: {
    readonly inputTokens: number;
    readonly outputTokens: number;
  };
}

export interface LLMOptions {
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly correlationId?: string;
  readonly tools?: readonly LLMTool[];
}

export interface LLMPort {
  complete(messages: readonly LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
}
