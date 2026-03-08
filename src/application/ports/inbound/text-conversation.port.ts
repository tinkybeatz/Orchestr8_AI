export interface TextMessage {
  readonly channelId: string;
  readonly userId: string;
  readonly content: string;
  readonly timestamp: Date;
}

export interface TextConversationPort {
  onMessage(handler: (message: TextMessage) => Promise<void>): void;
  sendReply(channelId: string, content: string): Promise<void>;
}
