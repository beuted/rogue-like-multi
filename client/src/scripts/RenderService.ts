import { Entity } from "./Entity";
import { SpriteManager } from "./SpriteManager";
import { Sprite, Container, Graphics } from "pixi.js";
import { Cell, CellHelper } from "./Cell";
import { Coord } from "./Coord";
import { Player } from "./Board";

export class RenderService {

  private entityContainer: Container;
  private mapContainer: Container;
  private inventoryContainer: Container;
  private effectContainer: Container;
  private pvContainer: Container;

  private entitySprites: {[name: string] : Sprite} = {};
  private characterSprite: Sprite;
  private inventorySprites: Sprite[] = [];
  private pvSprites: Sprite[] = [];

  private effects: { position: Coord, graphic: Graphics }[] = [];

  constructor(private spriteManager: SpriteManager) {
  }

  public init(mapContainer: Container, entityContainer: Container, inventoryContainer: Container, effectContainer: Container, pvContainer: Container) {
    this.entityContainer = entityContainer;
    this.mapContainer = mapContainer;
    this.inventoryContainer = inventoryContainer;
    this.effectContainer = effectContainer;
    this.pvContainer = pvContainer;
  }

  public renderEntity(entity: Entity, playerPosition: Coord) {
    // Remove if out of bounds
    if (entity.coord.x < playerPosition.x-9 || entity.coord.x > playerPosition.x+9 || entity.coord.y < playerPosition.y-9 || entity.coord.y > playerPosition.y+9) {
      if (this.entitySprites[entity.name]) {
        this.entitySprites[entity.name].parent.removeChild(this.entitySprites[entity.name]);
        delete this.entitySprites[entity.name];
      }
      return;
    }

    if (!this.entitySprites[entity.name]) {
      this.entitySprites[entity.name] = new Sprite(this.spriteManager.textures[entity.spriteId]);
      this.entityContainer.addChild(this.entitySprites[entity.name]);
    }

    this.entitySprites[entity.name].x = (entity.coord.x - playerPosition.x + 9) * this.spriteManager.tilesetSize;
    this.entitySprites[entity.name].y = (entity.coord.y - playerPosition.y + 9) * this.spriteManager.tilesetSize;
  }

  public renderCharacter(character: Entity) {
    if (!this.characterSprite) {
      this.characterSprite = new Sprite(this.spriteManager.textures[character.spriteId]);
      this.entityContainer.addChild(this.characterSprite);
    }

    this.characterSprite.x = 9*this.spriteManager.tilesetSize;
    this.characterSprite.y = 9*this.spriteManager.tilesetSize;
  }

  //TODO: there should be an "effectService"
  public addEffect(coord: Coord, color: number) {
    let graphic = new Graphics();
    graphic.beginFill(color, 0.5);
    graphic.drawRect(0, 0, this.spriteManager.tilesetSize, this.spriteManager.tilesetSize)
    this.effects.push({ position: coord, graphic: graphic });
    this.effectContainer.addChild(graphic);
  }

  public renderEffects(currentPlayer: Player) {
    const playerPosition = currentPlayer.entity.coord;
    for (let effect of this.effects) {
      // 0.25 = adjustment variable due to the back stripes around my assets
      effect.graphic.x = (effect.position.x - playerPosition.x + 9 + (0.5 - effect.graphic.scale.x/2)) * this.spriteManager.tilesetSize - 0.25;
      effect.graphic.y = (effect.position.y - playerPosition.y + 9 + (0.5 - effect.graphic.scale.y/2)) * this.spriteManager.tilesetSize - 0.25;
      effect.graphic.scale.set(effect.graphic.scale.x - 0.04);
      if (effect.graphic.scale.x <= 0) {
        this.effectContainer.removeChild(effect.graphic);
      }
    }
    //TODO clear the queue of effect.
  }

  public renderInventory(character: Entity) {
    let i = 0;
    for (; i < character.inventory.length; i++) {
      let item = character.inventory[i];
      if (!this.inventorySprites[i]) {
        this.inventorySprites[i] = new Sprite();
        this.inventorySprites[i].x = (i+20)*this.spriteManager.tilesetSize;
        this.inventorySprites[i].y = 3*this.spriteManager.tilesetSize;
        this.inventoryContainer.addChild(this.inventorySprites[i]);
      }
      this.inventorySprites[i].texture = this.spriteManager.textures[CellHelper.getItemSpriteId(item)]
    }
    // Clean the rest of the inventory
    for (let j = this.inventorySprites.length; j > i; j--) {
      this.inventoryContainer.removeChild(this.inventorySprites[i]);
      delete this.inventorySprites[i];
      this.inventorySprites.pop();
    }
  }
  public renderPv(character: Entity) {
    if (this.pvSprites.length == 0) {
      for (let i = 0; i < character.maxPv; i++) {
        this.pvSprites[i] = new Sprite();
        this.pvSprites[i].x = (i+20)*this.spriteManager.tilesetSize;
        this.pvSprites[i].y = 5*this.spriteManager.tilesetSize;
        this.pvContainer.addChild(this.pvSprites[i]);
      }
    }

    for (let i = 0; i < character.pv; i++) {
      this.pvSprites[i].texture = this.spriteManager.textures[66]; // full heart
    }

    for (let i = Math.max(0, character.pv); i < character.maxPv; i++) {
      this.pvSprites[i].texture = this.spriteManager.textures[64]; // empty heart
    }
  }

  public renderMap(cells: Cell[][], currentPlayer: Player, players: {[name: string]: Player}, entities: {[name: string]: Entity}) {
    const playerPosition = currentPlayer.entity.coord;
    this.mapContainer.removeChildren();
    for (let i = Math.max(0, playerPosition.x-9); i <= Math.min(cells.length-1, playerPosition.x+9); i++) {
      for (let j = Math.max(0, playerPosition.y-9); j <= Math.min(cells[0].length-1, playerPosition.y+9); j++) {
        const spriteId = CellHelper.getCellSpriteId(cells[i][j]);
        let cell = new Sprite(this.spriteManager.textures[spriteId]);
        cell.x = (i - playerPosition.x + 9) * this.spriteManager.tilesetSize;
        cell.y = (j - playerPosition.y + 9) * this.spriteManager.tilesetSize;
        this.mapContainer.addChild(cell);
      }
    }
    for (let entityName in entities) {
      this.renderEntity(entities[entityName], playerPosition);
    }

    for (let playerName in players) {
      if (playerName != currentPlayer.entity.name)
        this.renderEntity(players[playerName].entity, playerPosition);
    }

    //If players or entites have been removed from list we need to clean them
    for (let entitySpriteName in this.entitySprites) {
      if (!players[entitySpriteName] && !entities[entitySpriteName]) {
        this.entityContainer.removeChild(this.entitySprites[entitySpriteName]);
        delete this.entitySprites[entitySpriteName];
      }
    }
  }
}