export interface CreateChannelResult {
  readonly channelId: string;
  readonly channelName: string;
}

export interface ChannelManagementPort {
  createTextChannel(
    guildId: string,
    name: string,
    categoryId?: string,
    topic?: string,
  ): Promise<CreateChannelResult>;
  archiveChannel(channelId: string): Promise<void>;
}
