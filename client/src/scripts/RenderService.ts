import { Entity } from "./Entity";
import { SpriteManager } from "./SpriteManager";
import { Sprite, Container } from "pixi.js";
import { Cell, CellHelper } from "./Cell";
import { Coord } from "./Coord";
import { Player } from "./Board";

export class RenderService {

  private entityContainer: Container;
  private mapContainer: Container;
  private inventoryContainer: Container;
  private entitySprites: {[name: string] : Sprite} = {};
  private characterSprite: Sprite;
  private inventorySprites: Sprite[] = [];

  constructor(private spriteManager: SpriteManager) {
  }

  public init(mapContainer: Container, entityContainer: Container, inventoryContainer: Container) {
    this.entityContainer = entityContainer;
    this.mapContainer = mapContainer;
    this.inventoryContainer = inventoryContainer;
  }

  public renderEntity(entity: Entity, playerPosition: Coord) {
    // Remove if out of bounds
    if (entity.coord.x < playerPosition.x-10 || entity.coord.x > playerPosition.x+9 || entity.coord.y < playerPosition.y-10 || entity.coord.y > playerPosition.y+9) {
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

    this.entitySprites[entity.name].x = (entity.coord.x - playerPosition.x + 10) * this.spriteManager.tilesetSize;
    this.entitySprites[entity.name].y = (entity.coord.y - playerPosition.y + 10) * this.spriteManager.tilesetSize;
  }

  public renderCharacter(character: Entity) {
    if (!this.characterSprite) {
      this.characterSprite = new Sprite(this.spriteManager.textures[character.spriteId]);
      this.entityContainer.addChild(this.characterSprite);
    }

    this.characterSprite.x = 10*this.spriteManager.tilesetSize;
    this.characterSprite.y = 10*this.spriteManager.tilesetSize;
  }

  public renderInventory(character: Entity) {
    let i = 0;
    for (; i < character.inventory.length; i++) {
      let item = character.inventory[i];
      if (!this.inventorySprites[i]) {
        this.inventorySprites[i] = new Sprite();
        this.inventorySprites[i].x = 21*this.spriteManager.tilesetSize;
        this.inventorySprites[i].y = (i+1)*this.spriteManager.tilesetSize;
        this.inventoryContainer.addChild(this.inventorySprites[i])
      }
      this.inventorySprites[i].texture = this.spriteManager.textures[CellHelper.getItemSpriteId(item)]
    }
    // Clean the rest of the inventory
    for (let j = i; j < this.inventorySprites.length; j++) {
      delete this.inventorySprites[i];
      this.inventoryContainer.removeChild(this.inventorySprites[i]);
    }
  }

  public renderMap(cells: Cell[][], currentPlayer: Player, players: {[name: string]: Player}, entities: {[name: string]: Entity}) {
    const playerPosition = currentPlayer.entity.coord;
    this.mapContainer.removeChildren();
    for (let i = Math.max(0, playerPosition.x-10); i < Math.min(cells.length, playerPosition.x+10); i++) {
      for (let j = Math.max(0, playerPosition.y-10); j < Math.min(cells[0].length, playerPosition.y+10); j++) {
        const spriteId = CellHelper.getCellSpriteId(cells[i][j]);
        let cell = new Sprite(this.spriteManager.textures[spriteId]);
        cell.x = (i - playerPosition.x + 10) * this.spriteManager.tilesetSize;
        cell.y = (j - playerPosition.y + 10) * this.spriteManager.tilesetSize;
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
  }
}