export const SpanNames = {
  ORCHESTRATION_RUN: 'orchestration.run',
  ORCHESTRATION_STEP: 'orchestration.step',
  CHECKPOINT_SAVE: 'checkpoint.save',
  CHECKPOINT_LOAD: 'checkpoint.load',
  OUTBOX_DISPATCH: 'outbox.dispatch',
  OUTBOX_POLL: 'outbox.poll',
  EVENT_PUBLISH: 'event.publish',
  EVENT_CONSUME: 'event.consume',
  LLM_CALL: 'llm.call',
  MCP_TOOL_CALL: 'mcp.tool.call',
  MCP_TOOL_LIST: 'mcp.tool.list',
  DB_QUERY: 'db.query',
  DB_MIGRATE: 'db.migrate',
  DLQ_ROUTE: 'dlq.route',
} as const;

export type SpanName = (typeof SpanNames)[keyof typeof SpanNames];

export const DISCORD_MESSAGE_RECEIVED = 'discord.message.received';
export const DISCORD_PROJECT_CREATED = 'discord.project.created';
export const DISCORD_CHANNEL_CREATED = 'discord.channel.created';
export const DISCORD_AGENT_REPLY = 'discord.agent.reply';
