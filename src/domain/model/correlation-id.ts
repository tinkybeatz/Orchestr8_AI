import { v4 as uuidv4, validate } from 'uuid';
import { ValueObject } from './value-object.js';
import { ValidationError } from '../errors/domain-error.js';

interface CorrelationIdProps {
  [key: string]: unknown;
  value: string;
}

export class CorrelationId extends ValueObject<CorrelationIdProps> {
  private constructor(props: CorrelationIdProps) {
    super(props);
  }

  static create(value?: string): CorrelationId {
    const id = value ?? uuidv4();
    if (!validate(id)) {
      throw new ValidationError(`Invalid CorrelationId: ${id}`);
    }
    return new CorrelationId({ value: id });
  }

  get value(): string {
    return this.props.value;
  }

  override toString(): string {
    return this.props.value;
  }
}
