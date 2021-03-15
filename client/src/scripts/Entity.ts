import { FloatingCoord } from "./Coord";
import { ItemType } from "./Cell";

export enum EntityType {
  Snake = 14,
  Dog = 15,
  Rat = 16,
}

export class Entity {
  public coord: FloatingCoord;
  public name: string = null;
  public spriteId = 6;
  public pv: number;
  public maxPv: number;
  public inventory: ItemType[];
  public coolDownAttack: number;
  public coolDownDash: number
  public isDashing: boolean;
}