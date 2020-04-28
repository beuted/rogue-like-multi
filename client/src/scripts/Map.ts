import { Cell } from "./Cell";
import { Container, Sprite } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { Entity } from "./Entity";

export class Map {
  private size: number = 20
  private cells: Cell[][] = [];
  private entities: {[name: string]: Entity} = {}; //TODO registerListener

  constructor(private spriteManager: SpriteManager) {
  }

  public init() {
    this.cells = [];
    for (let i = 0; i < this.size; i++) {
      this.cells.push([]);
      for (let j = 0; j < this.size; j++) {
        this.cells[i].push({spriteId: this.getRandomSpriteId()});
      }
    }
  }

  public addEntity(entity: Entity) {
    this.entities[entity.name] = entity;
  }

  public removeEntity(entityName: string) {
    delete this.entities[entityName];
  }

  public render(container: Container) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let cell = new Sprite(this.spriteManager.textures[this.cells[i][j].spriteId]);
        cell.x = i*this.spriteManager.tilesetSize;
        cell.y = j*this.spriteManager.tilesetSize;
        container.addChild(cell);
      }
    }

    for (let entityName in this.entities) {
      this.entities[entityName].render();
    }
  }

  private getRandomSpriteId(): number {
    const okSpriteId = [11, 11, 11, 11, 44, 44, 45, 54, 55, 56];
    var id = Math.floor(Math.random() * okSpriteId.length);
    return okSpriteId[id];
  }
}