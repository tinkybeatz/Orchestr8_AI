import { v4 as uuidv4, validate } from 'uuid';
import { ValueObject } from './value-object.js';
import { ValidationError } from '../errors/domain-error.js';

interface RunIdProps {
  [key: string]: unknown;
  value: string;
}

export class RunId extends ValueObject<RunIdProps> {
  private constructor(props: RunIdProps) {
    super(props);
  }

  static create(value?: string): RunId {
    const id = value ?? uuidv4();
    if (!validate(id)) {
      throw new ValidationError(`Invalid RunId: ${id}`);
    }
    return new RunId({ value: id });
  }

  get value(): string {
    return this.props.value;
  }

  override toString(): string {
    return this.props.value;
  }
}
