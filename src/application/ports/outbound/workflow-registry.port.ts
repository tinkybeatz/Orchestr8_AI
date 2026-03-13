export interface WorkflowNodeDoc {
  name: string;
  type: string;
  role: string;
  configSummary?: string;
}

export interface WorkflowDocumentation {
  overview: string;
  trigger: string;
  dataFlow: string;
  nodes: WorkflowNodeDoc[];
  errorHandling: string;
  externalDeps: string[];
  notes?: string;
}

export interface WorkflowRecord {
  readonly id: string;
  readonly projectId: string;
  readonly workflowId: string;
  readonly name: string;
  readonly content: Record<string, unknown>;
  readonly documentation: WorkflowDocumentation | null;
  readonly syncedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type WorkflowSummary = Pick<WorkflowRecord, 'workflowId' | 'name' | 'documentation' | 'syncedAt'>;

export interface WorkflowRegistryPort {
  upsert(
    projectId: string,
    workflowId: string,
    name: string,
    content: Record<string, unknown>,
  ): Promise<WorkflowRecord>;

  setDocumentation(
    projectId: string,
    workflowId: string,
    doc: WorkflowDocumentation,
  ): Promise<void>;

  list(projectId: string): Promise<WorkflowSummary[]>;

  get(projectId: string, workflowId: string): Promise<WorkflowRecord | null>;

  delete(projectId: string, workflowId: string): Promise<void>;
}
