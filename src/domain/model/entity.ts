import { v4 as uuidv4 } from 'uuid';

export abstract class Entity {
  public readonly id: string;

  protected constructor(id?: string) {
    this.id = id ?? uuidv4();
  }

  equals(other: Entity): boolean {
    if (!(other instanceof Entity)) return false;
    return this.id === other.id;
  }
}
