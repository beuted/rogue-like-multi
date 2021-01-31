import { FloatingCoord } from "./Coord";
import { ItemType } from "./Cell";

export class Entity {
  public coord: FloatingCoord;
  public name: string = null;
  public spriteId = 6;
  public pv: number;
  public maxPv: number;
  public inventory: ItemType[];
  public coolDownAttack: number;
}