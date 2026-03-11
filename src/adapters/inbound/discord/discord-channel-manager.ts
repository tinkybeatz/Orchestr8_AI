import {
  ChannelType,
  type Client,
  type TextChannel,
} from 'discord.js';
import type {
  ChannelManagementPort,
  CreateChannelResult,
} from '../../../application/ports/outbound/channel-management.port.js';

export class DiscordChannelManager implements ChannelManagementPort {
  constructor(private readonly client: Client) {}

  async createTextChannel(
    guildId: string,
    name: string,
    categoryId?: string,
    topic?: string,
  ): Promise<CreateChannelResult> {
    const guild = await this.client.guilds.fetch(guildId);
    const channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      ...(categoryId ? { parent: categoryId } : {}),
      ...(topic ? { topic } : {}),
    });
    return { channelId: channel.id, channelName: channel.name };
  }

  async archiveChannel(channelId: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (channel?.isTextBased() && 'setName' in channel) {
      const tc = channel as TextChannel;
      await tc.setName(`archived-${tc.name}`);
    }
  }

  async deleteChannel(channelId: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (channel && !channel.isDMBased()) {
      await channel.delete();
    }
  }
}
