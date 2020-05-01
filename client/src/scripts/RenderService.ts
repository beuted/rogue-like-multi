import { Entity } from "./Entity";
import { SpriteManager } from "./SpriteManager";
import { Sprite, Container } from "pixi.js";

export class RenderService {

  private entityContainer: Container;
  private entitySprites: {[name: string] : Sprite} = {};
  private characterSprite: Sprite;

  constructor(private spriteManager: SpriteManager) {
  }

  public init(entityContainer: Container) {
    this.entityContainer = entityContainer;
  }

  public renderEntity(entity: Entity) {
    if (!this.entitySprites[entity.name])
      this.entitySprites[entity.name] = new Sprite(this.spriteManager.textures[entity.spriteId]);

    this.entitySprites[entity.name].x = entity.coord.x * this.spriteManager.tilesetSize;
    this.entitySprites[entity.name].y = entity.coord.y * this.spriteManager.tilesetSize;
    this.entityContainer.addChild(this.entitySprites[entity.name]);
  }

  public renderCharacter(character: Entity) {
    if (!this.characterSprite)
      this.characterSprite = new Sprite(this.spriteManager.textures[character.spriteId]);

    this.characterSprite.x = character.coord.x*this.spriteManager.tilesetSize;
    this.characterSprite.y = character.coord.y*this.spriteManager.tilesetSize;
    this.entityContainer.addChild(this.characterSprite);
  }
}