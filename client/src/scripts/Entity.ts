import { Container, Sprite } from "pixi.js";
import { SpriteManager } from "./SpriteManager";

//TODO: Class should not be a model and a service
export class Entity {
  public x: number = 0;
  public y: number = 0;
  public name: string = null;

  private spriteId = 6;
  private cell: Sprite;

  constructor(private spriteManager: SpriteManager) {
  }

  public init(container: Container, username: string, x: number, y: number) {
    this.name = username;
    this.cell = new Sprite(this.spriteManager.textures[this.spriteId]);
    container.addChild(this.cell);
    this.x = x;
    this.y = y;
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public render() {
    this.cell.x = this.x*this.spriteManager.tilesetSize;
    this.cell.y = this.y*this.spriteManager.tilesetSize;
  }
}