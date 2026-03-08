import type { VersionedPayload } from '../versioning.js';
import { wrapPayload, validateVersion } from '../versioning.js';

export interface RunCheckpointV1 {
  readonly runId: string;
  readonly stepIndex: number;
  readonly state: Record<string, unknown>;
}

export const RUN_CHECKPOINT_TYPE = 'run.checkpoint';
export const RUN_CHECKPOINT_VERSION = 1;

export function wrapRunCheckpoint(data: RunCheckpointV1): VersionedPayload<RunCheckpointV1> {
  return wrapPayload(RUN_CHECKPOINT_TYPE, RUN_CHECKPOINT_VERSION, data);
}

export function validateRunCheckpoint(payload: VersionedPayload<RunCheckpointV1>): void {
  validateVersion(payload, RUN_CHECKPOINT_TYPE, RUN_CHECKPOINT_VERSION);
}
