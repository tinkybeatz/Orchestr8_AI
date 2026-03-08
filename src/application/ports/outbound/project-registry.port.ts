export interface N8nConfig {
  readonly apiUrl: string;
  readonly apiKey: string;
}

export interface ProjectRecord {
  readonly id: string;
  readonly channelId: string;
  readonly guildId: string;
  readonly name: string;
  readonly purpose: string | null;
  readonly n8nConfig: N8nConfig;
  readonly status: 'active' | 'paused' | 'archived';
  readonly createdAt: Date;
  readonly createdBy: string;
}

export interface CreateProjectInput {
  readonly channelId: string;
  readonly guildId: string;
  readonly name: string;
  readonly purpose?: string;
  readonly n8nConfig: N8nConfig;
  readonly createdBy: string;
}

export interface ProjectRegistryPort {
  findByChannelId(channelId: string): Promise<ProjectRecord | null>;
  listAll(guildId: string): Promise<ProjectRecord[]>;
  create(input: CreateProjectInput): Promise<ProjectRecord>;
  updateStatus(channelId: string, status: ProjectRecord['status']): Promise<void>;
}
