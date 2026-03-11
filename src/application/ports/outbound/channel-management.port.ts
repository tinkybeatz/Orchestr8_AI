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
  renameChannel(channelId: string, name: string): Promise<void>;
  setChannelTopic(channelId: string, topic: string): Promise<void>;
  archiveChannel(channelId: string): Promise<void>;
  deleteChannel(channelId: string): Promise<void>;
}
