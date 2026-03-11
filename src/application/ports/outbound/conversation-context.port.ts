export interface ContextMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface ConversationContextPort {
  load(channelId: string, limit: number): Promise<ContextMessage[]>;
  append(channelId: string, messages: ContextMessage[]): Promise<void>;
  deleteByChannel(channelId: string): Promise<void>;
}
