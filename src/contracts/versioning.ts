export interface VersionedPayload<T> {
  readonly version: number;
  readonly type: string;
  readonly data: T;
  readonly timestamp: string;
}

export function wrapPayload<T>(type: string, version: number, data: T): VersionedPayload<T> {
  return {
    version,
    type,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function validateVersion<T>(
  payload: VersionedPayload<T>,
  expectedType: string,
  maxVersion: number,
): void {
  if (payload.type !== expectedType) {
    throw new Error(`Unexpected payload type: ${payload.type}, expected: ${expectedType}`);
  }
  if (payload.version < 1 || payload.version > maxVersion) {
    throw new Error(
      `Unsupported version ${payload.version} for type ${expectedType}. Max: ${maxVersion}`,
    );
  }
}
