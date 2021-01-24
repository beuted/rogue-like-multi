import { Coord } from "./Coord";
import { ItemType } from "./Cell";

export class Entity {
  public coord: Coord;
  public name: string = null;
  public spriteId = 6;
  public pv: number;
  public maxPv: number;
  public inventory: ItemType[];
  public coolDownAttack: number;
}