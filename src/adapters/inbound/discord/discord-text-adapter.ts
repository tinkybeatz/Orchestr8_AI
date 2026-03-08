import {
  Client,
  GatewayIntentBits,
  type Message,
  type TextChannel,
} from 'discord.js';
import type {
  TextConversationPort,
  TextMessage,
} from '../../../application/ports/inbound/text-conversation.port.js';

const DISCORD_MAX_MESSAGE_LENGTH = 2000;

function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, maxLength));
    remaining = remaining.slice(maxLength);
  }
  return chunks;
}

export class DiscordTextAdapter implements TextConversationPort {
  private readonly client: Client;
  private handler: ((message: TextMessage) => Promise<void>) | null = null;

  constructor(private readonly token: string) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
  }

  async connect(): Promise<void> {
    this.client.on('messageCreate', (msg: Message) => {
      if (msg.author.bot) return;
      if (!this.handler) return;
      void this.handler({
        channelId: msg.channelId,
        userId: msg.author.id,
        content: msg.content,
        timestamp: msg.createdAt,
      });
    });
    await this.client.login(this.token);
    console.info('[Orchestr8_AI] Discord bot connected.');
  }

  onMessage(handler: (message: TextMessage) => Promise<void>): void {
    this.handler = handler;
  }

  async sendReply(channelId: string, content: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return;
    const chunks = splitMessage(content, DISCORD_MAX_MESSAGE_LENGTH);
    for (const chunk of chunks) {
      await (channel as TextChannel).send(chunk);
    }
  }

  getClient(): Client {
    return this.client;
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
  }
}
