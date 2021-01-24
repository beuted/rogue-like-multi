import { Entity } from "./Entity";
import { SpriteManager } from "./SpriteManager";
import { Sprite, Container, Graphics, Text } from "pixi.js";
import { Cell, CellHelper, ItemType } from "./Cell";
import { Coord, MathHelper, CoordHelper } from "./Coord";
import { Player, Role } from "./Board";
import { LightRenderService } from "./LightRenderService";
import { ParticleRenderService } from "./ParticleRenderService";
import { InputManager } from "./InputManager";
import { CharacterController } from "./CharacterController";

export class RenderService {

  private entityContainer: Container;
  private mapContainer: Container;
  private mapSceneContainer: Container;
  private inventoryContainer: Container;
  private effectContainer: Container;
  private pvContainer: Container;
  private cellsContainer: Container;

  private entitySprites: { [name: string]: Sprite } = {};
  private characterSprite: Sprite;
  private deadCharacterSprite: Sprite;
  private inventorySprites: Sprite[] = [];
  private pvSprites: Sprite[] = [];

  private roleText: Text;

  constructor(private spriteManager: SpriteManager, private lightRenderService: LightRenderService,
    private particleRenderService: ParticleRenderService, private inputManager: InputManager, private characterController: CharacterController) {
  }

  public init() {
    let sceneContainer = new Container();
    sceneContainer.scale.set(4);
    this.mapSceneContainer = new Container();
    this.mapContainer = new Container();
    this.mapContainer.sortableChildren = true;
    this.mapSceneContainer.addChild(this.mapContainer);
    sceneContainer.addChild(this.mapSceneContainer);
    this.cellsContainer = new Container();
    this.mapContainer.addChild(this.cellsContainer);
    this.entityContainer = new Container();
    this.mapContainer.addChild(this.entityContainer);
    let graphic = new Graphics();
    graphic.beginFill(0xFFFFFF);
    // 19 = tiles displayed on screen, 4 = scale factor
    graphic.drawRect(0, 0, this.spriteManager.tilesetSize * 19 * 4, this.spriteManager.tilesetSize * 19 * 4);
    this.mapSceneContainer.mask = graphic;

    this.effectContainer = new Container();
    sceneContainer.addChild(this.effectContainer);
    this.inventoryContainer = new Container();
    sceneContainer.addChild(this.inventoryContainer);
    this.pvContainer = new Container();
    sceneContainer.addChild(this.pvContainer);

    return sceneContainer;
  }

  public postMapInit(cells: Cell[][]) {
    this.lightRenderService.init(this.mapContainer, cells);
    this.particleRenderService.init(this.mapContainer, cells);
  }

  public renderEntity(entity: Entity, playerPosition: Coord, previousEntityPosition: Coord | undefined, interpolFactor: number, cells: Cell[][], isHiding: boolean) {
    if (!previousEntityPosition)
      previousEntityPosition = entity.coord;
    // Remove if out of bounds or dead
    if (entity.coord.x < playerPosition.x - 9 || entity.coord.x > playerPosition.x + 9 || entity.coord.y < playerPosition.y - 9 || entity.coord.y > playerPosition.y + 9 || entity.pv <= 0) {
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

    const coord = CoordHelper.getClosestCoord(entity.coord);
    if (!isHiding && CellHelper.isHiding(cells[coord.x][coord.y])) {
      if (this.entitySprites[entity.name].alpha == 1.0) {
        this.particleRenderService.addLeafStaticEmitter(entity.coord);
      }
      this.entitySprites[entity.name].alpha = 0.1; //TODO: maybe just remove it
    } else {
      if (this.entitySprites[entity.name].alpha == 0.1) {
        this.particleRenderService.addLeafStaticEmitter(entity.coord);
      }
      this.entitySprites[entity.name].alpha = 1.0;
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

  public renderCharacter(character: Entity, isHiding: boolean) {
    if (!this.characterSprite) {
      this.characterSprite = new Sprite(this.spriteManager.textures[character.spriteId]);
      this.characterSprite.zIndex = 1;
      this.mapContainer.addChild(this.characterSprite);
    }

    if (character.pv <= 0 && !this.deadCharacterSprite) {
      this.characterSprite.destroy();
      this.deadCharacterSprite = new Sprite(this.spriteManager.textures[19]);
      this.mapContainer.addChild(this.deadCharacterSprite);
    }

    // If dead
    if (character.pv <= 0) {
      this.deadCharacterSprite.x = character.coord.x * this.spriteManager.tilesetSize;
      this.deadCharacterSprite.y = character.coord.y * this.spriteManager.tilesetSize;
    } else {
      if (isHiding) {
        if (this.characterSprite.alpha == 1.0) {
          this.particleRenderService.addLeafStaticEmitter(character.coord);
        }
        this.characterSprite.alpha = 0.5;
      } else {
        if (this.characterSprite.alpha == 0.5) {
          this.particleRenderService.addLeafStaticEmitter(character.coord);
        }
        this.characterSprite.alpha = 1.0;
      }

      this.characterSprite.x = character.coord.x * this.spriteManager.tilesetSize;
      this.characterSprite.y = character.coord.y * this.spriteManager.tilesetSize;
    }
  }

  public renderEffects(character: Player, timestampDiff: number, isHiding: boolean, nbSecsPerCycle: number, delta: number) {
    this.lightRenderService.render(character, timestampDiff, isHiding, nbSecsPerCycle);
    this.particleRenderService.render(delta);
  }

  public renderInventory(character: Entity) {
    let i = 0;
    for (; i < character.inventory.length; i++) {
      let item = character.inventory[i];
      if (!this.inventorySprites[i]) {
        this.inventorySprites[i] = new Sprite();
        this.inventorySprites[i].x = (i + 20) * this.spriteManager.tilesetSize;
        this.inventorySprites[i].y = 3 * this.spriteManager.tilesetSize;
        this.inventoryContainer.addChild(this.inventorySprites[i]);
        this.inventorySprites[i].interactive = true;
      }
      this.inventorySprites[i].texture = this.spriteManager.textures[item];

      // Could be optimized we only need to do this when items changes
      this.inventorySprites[i].off('mousedown');
      this.inventorySprites[i].on('mousedown',
        ((i: number) => ((_: any) => {
          const input = this.inputManager.getUseItem(character.inventory[i]);
          this.characterController.sendInput(input);
          console.log('Use item:', character.inventory[i]);
        }))(i)
      );
      this.inventorySprites[i].off('mouseover');
      this.inventorySprites[i].on('mouseover',
        ((sprite: Sprite) => ((_: any) => {
          sprite.alpha = 0.6;
        }))(this.inventorySprites[i])
      );
      this.inventorySprites[i].off('mouseout');
      this.inventorySprites[i].on('mouseout',
        ((sprite: Sprite) => ((_: any) => {
          sprite.alpha = 1.0;
        }))(this.inventorySprites[i])
      );
    }
    // Clean the rest of the inventory
    for (let j = this.inventorySprites.length - 1; j >= i; j--) {
      this.inventoryContainer.removeChild(this.inventorySprites[j]);
      delete this.inventorySprites[j];
      this.inventorySprites.pop();
    }
  }

  public renderPv(character: Entity) {
    if (this.pvSprites.length == 0) {
      for (let i = 0; i < character.maxPv; i++) {
        this.pvSprites[i] = new Sprite();
        this.pvSprites[i].x = (i + 20) * this.spriteManager.tilesetSize;
        this.pvSprites[i].y = 5 * this.spriteManager.tilesetSize;
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
    if (!this.roleText) {
      this.roleText = new Text('', { fontFamily: 'Arial', fontSize: this.spriteManager.tilesetSize, fill: 0xffffff, align: 'center' });
      this.roleText.x = 20 * this.spriteManager.tilesetSize;
      this.roleText.y = 1 * this.spriteManager.tilesetSize;
      this.pvContainer.addChild(this.roleText);
    }
    this.roleText.text = `${role == Role.Bad ? "Bad" : "Good"} Time: ${String(time)}`;
  }

  public renderMap(cells: Cell[][], currentPlayer: Player, players: { [name: string]: Player }, entities: { [name: string]: Entity }, entitiesPreviousCoords: { [name: string]: Coord }, isHiding: boolean, interpolFactor: number) {
    const roundedPlayerPosition = CoordHelper.getClosestCoord(currentPlayer.entity.coord);
    const playerPosition = currentPlayer.entity.coord;
    this.cellsContainer.removeChildren();
    for (let i = Math.max(0, roundedPlayerPosition.x - 9 - 1); i <= Math.min(cells.length - 1, roundedPlayerPosition.x + 9 + 1); i++) {
      for (let j = Math.max(0, roundedPlayerPosition.y - 9 - 1); j <= Math.min(cells[0].length - 1, roundedPlayerPosition.y + 9 + 1); j++) {
        const spriteId = cells[i][j].floorType;
        let cell = new Sprite(this.spriteManager.textures[spriteId]);
        cell.x = i * this.spriteManager.tilesetSize;
        cell.y = j * this.spriteManager.tilesetSize;
        this.cellsContainer.addChild(cell);
        if (cells[i][j].itemType != null && cells[i][j].itemType != ItemType.Empty) {
          let itemCell = new Sprite(this.spriteManager.textures[cells[i][j].itemType]);
          itemCell.x = i * this.spriteManager.tilesetSize;
          itemCell.y = j * this.spriteManager.tilesetSize;
          this.cellsContainer.addChild(itemCell);
        }
      }
    }

    this.mapContainer.x =
      (9 - playerPosition.x) * this.spriteManager.tilesetSize;
    this.mapContainer.y =
      (9 - playerPosition.y) * this.spriteManager.tilesetSize;

    for (let entityName in entities) {
      this.renderEntity(entities[entityName], playerPosition, entitiesPreviousCoords[entityName], interpolFactor, cells, isHiding);
    }

    for (let playerName in players) {
      if (playerName != currentPlayer.entity.name)
        this.renderEntity(players[playerName].entity, playerPosition, entitiesPreviousCoords[playerName], interpolFactor, cells, isHiding);
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