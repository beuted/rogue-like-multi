import { Entity } from "./Entity";
import { SpriteManager } from "./SpriteManager";
import { Sprite, Container } from "pixi.js";

export class RenderService {

  private entityContainer: Container;

  constructor(private spriteManager: SpriteManager) {
  }

  public init(entityContainer: Container) {
    this.entityContainer = entityContainer;
  }

  public renderEntity(entity: Entity) {
    //TODO: creating new sprites might be inefficient.
    let sprite = new Sprite(this.spriteManager.textures[entity.spriteId]);
    sprite.x = entity.coord.x * this.spriteManager.tilesetSize;
    sprite.y = entity.coord.y * this.spriteManager.tilesetSize;
    this.entityContainer.addChild(sprite);

    console.log("render", entity.coord.x, entity.coord.y, entity.spriteId)
  }
}