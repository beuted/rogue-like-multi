import { Entity } from "./Entity";
import { SpriteManager } from "./SpriteManager";
import { Sprite, Container, Graphics, Text } from "pixi.js";
import { Cell, CellHelper } from "./Cell";
import { Coord, MathHelper, CoordHelper } from "./Coord";
import { Player, Role } from "./Board";
import { LightRenderService } from "./LightRenderService";

export class RenderService {

  private entityContainer: Container;
  private mapContainer: Container;
  private mapSceneContainer: Container;
  private inventoryContainer: Container;
  private effectContainer: Container;
  private pvContainer: Container;
  private cellsContainer: Container;

  private entitySprites: {[name: string] : Sprite} = {};
  private characterSprite: Sprite;
  private inventorySprites: Sprite[] = [];
  private pvSprites: Sprite[] = [];

  private nbBagFoundText: Text;

  constructor(private spriteManager: SpriteManager, private lightRenderService: LightRenderService) {
  }

  public init() {
    let sceneContainer = new Container();
    sceneContainer.scale.set(4);
    this.mapSceneContainer = new Container();
    this.mapContainer = new Container();
    this.mapSceneContainer.addChild(this.mapContainer)
    sceneContainer.addChild(this.mapSceneContainer);
    this.cellsContainer = new Container();
    this.mapContainer.addChild(this.cellsContainer);
    this.entityContainer = new Container();
    this.mapContainer.addChild(this.entityContainer);
    let graphic = new Graphics();
    this.mapContainer.mask = graphic;
    graphic.beginFill(0xFFFFFF);
    // 19 = tiles displayed on screen, 4 = scale factor
    graphic.drawRect(0, 0, this.spriteManager.tilesetSize*19*4, this.spriteManager.tilesetSize*19*4);

    this.effectContainer = new Container();
    sceneContainer.addChild(this.effectContainer);
    this.inventoryContainer = new Container();
    sceneContainer.addChild(this.inventoryContainer);
    this.pvContainer = new Container();
    sceneContainer.addChild(this.pvContainer);

    this.lightRenderService.init(this.mapContainer);

    return sceneContainer;
  }

  public renderEntity(entity: Entity, playerPosition: Coord, previousEntityPosition: Coord | undefined, interpolFactor: number) {
    if (!previousEntityPosition)
      previousEntityPosition = entity.coord;
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

    this.entitySprites[entity.name].x = MathHelper.lerp(
      previousEntityPosition.x * this.spriteManager.tilesetSize,
      entity.coord.x * this.spriteManager.tilesetSize,
      interpolFactor);
    this.entitySprites[entity.name].y = MathHelper.lerp(
      previousEntityPosition.y * this.spriteManager.tilesetSize,
      entity.coord.y * this.spriteManager.tilesetSize,
      interpolFactor);
  }

  public renderCharacter(character: Entity) {
    if (!this.characterSprite) {
      this.characterSprite = new Sprite(this.spriteManager.textures[character.spriteId]);
      this.effectContainer.addChild(this.characterSprite);
    }

    this.characterSprite.x = 9*this.spriteManager.tilesetSize;
    this.characterSprite.y = 9*this.spriteManager.tilesetSize;
  }

  public renderEffects(character: Entity, timestampDiff: number, nbSecsPerCycle: number) {
    this.lightRenderService.render(character, timestampDiff, nbSecsPerCycle);
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
      this.inventorySprites[i].texture = this.spriteManager.textures[item]
    }
    // Clean the rest of the inventory
    for (let j = this.inventorySprites.length-1; j >= i; j--) {
      this.inventoryContainer.removeChild(this.inventorySprites[j]);
      delete this.inventorySprites[j];
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

  public renderGameState(role: Role, time: number) {
    if (!this.nbBagFoundText) {
      this.nbBagFoundText = new Text('', {fontFamily : 'Arial', fontSize: this.spriteManager.tilesetSize, fill : 0xffffff, align : 'center'});
      this.nbBagFoundText.x = 20*this.spriteManager.tilesetSize;
      this.nbBagFoundText.y = 1*this.spriteManager.tilesetSize;
      this.pvContainer.addChild(this.nbBagFoundText);
    }
    this.nbBagFoundText.text = `${role == Role.Bad ? "Bad" : "Good"} Time: ${String(time)}`;
  }

  public renderMap(cells: Cell[][], currentPlayer: Player, players: {[name: string]: Player}, entities: {[name: string]: Entity}, entitiesPreviousCoords: { [name: string]: Coord }, interpolFactor: number) {
    const roundedPlayerPosition = CoordHelper.getClosestCoord(currentPlayer.entity.coord);
    const playerPosition = currentPlayer.entity.coord;
    this.cellsContainer.removeChildren();
    for (let i = Math.max(0, roundedPlayerPosition.x-9-1); i <= Math.min(cells.length-1, roundedPlayerPosition.x+9+1); i++) {
      for (let j = Math.max(0, roundedPlayerPosition.y-9-1); j <= Math.min(cells[0].length-1, roundedPlayerPosition.y+9+1); j++) {
        const spriteId = CellHelper.getCellSpriteId(cells[i][j]);
        let cell = new Sprite(this.spriteManager.textures[spriteId]);
        cell.x = i * this.spriteManager.tilesetSize;
        cell.y = j * this.spriteManager.tilesetSize;
        this.cellsContainer.addChild(cell);
      }
    }

    this.mapContainer.x =
      (9 - playerPosition.x) * this.spriteManager.tilesetSize;
    this.mapContainer.y =
      (9 - playerPosition.y) * this.spriteManager.tilesetSize;

    for (let entityName in entities) {
      this.renderEntity(entities[entityName], playerPosition, entitiesPreviousCoords[entityName], interpolFactor);
    }

    for (let playerName in players) {
      if (playerName != currentPlayer.entity.name)
        this.renderEntity(players[playerName].entity, playerPosition, entitiesPreviousCoords[playerName], interpolFactor);
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