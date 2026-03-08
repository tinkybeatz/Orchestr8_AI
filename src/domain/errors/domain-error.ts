export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  protected constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND');
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

export class InfrastructureError extends DomainError {
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message, 'INFRASTRUCTURE_ERROR');
    this.cause = cause;
  }
}
