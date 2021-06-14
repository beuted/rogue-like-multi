import { Entity } from "./Entity";
import { SpriteManager } from "./SpriteManager";
import { Sprite, Container, Graphics, Text, AnimatedSprite } from "pixi.js";
import { Cell, CellHelper, ItemType } from "./Cell";
import { Coord, MathHelper, CoordHelper } from "./Coord";
import { Player, Role } from "./Board";
import { LightRenderService } from "./LightRenderService";
import { ParticleRenderService } from "./ParticleRenderService";
import { InputManager } from "./InputManager";
import { CharacterController } from "./CharacterController";
import { SoundManager, Sound } from "./SoundManager";

export class RenderService {
  private entityContainer: Container;
  private mapContainer: Container;
  private mapSceneContainer: Container;
  private inventoryContainer: Container;
  private effectContainer: Container;
  private pvContainer: Container;
  private cellsContainer: Container;

  private entitySprites: { [name: string]: { sprite: AnimatedSprite, name: Text, shadow: Graphics } } = {};
  private characterSprite: AnimatedSprite;
  private characterShadow: Graphics;
  private deadCharacterSprite: Sprite;
  private inventorySprites: Sprite[] = [];
  private inventoryIndexes: Text[] = [];
  private inventoryBg: Sprite;
  private pvSprites: Sprite[] = [];
  private roleSprite: Sprite;
  private musicSprite: Sprite;

  private roleText: Text;

  constructor(private spriteManager: SpriteManager, private lightRenderService: LightRenderService,
    private particleRenderService: ParticleRenderService, private inputManager: InputManager, private characterController: CharacterController,
    private soundManager: SoundManager) {
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

  public renderEntity(entity: Entity, playerPosition: Coord, previousEntityPosition: Coord | undefined, interpolFactor: number, cells: Cell[][], isTargetted: boolean, isHiding: boolean, showName: boolean) {
    var hasJustBeenAdded = false;

    if (!previousEntityPosition)
      previousEntityPosition = entity.coord;
    // Remove if out of bounds or dead
    if (entity.coord.x < playerPosition.x - 9 || entity.coord.x > playerPosition.x + 9 || entity.coord.y < playerPosition.y - 9 || entity.coord.y > playerPosition.y + 9 || entity.pv <= 0) {
      if (this.entitySprites[entity.name]) {
        this.entitySprites[entity.name].sprite.parent.removeChild(this.entitySprites[entity.name].sprite);
        this.entitySprites[entity.name].name.parent.removeChild(this.entitySprites[entity.name].name);
        this.entitySprites[entity.name].shadow.parent.removeChild(this.entitySprites[entity.name].shadow);
        delete this.entitySprites[entity.name];
      }
      return;
    }

    if (!this.entitySprites[entity.name]) {
      hasJustBeenAdded = true;
      this.entitySprites[entity.name] = { sprite: null, name: null, shadow: null };

      // Shadow
      this.entitySprites[entity.name].shadow = new Graphics();
      this.entitySprites[entity.name].shadow.beginFill(0x000000, 0.5);
      this.entitySprites[entity.name].shadow.drawEllipse(0, 0, 0.5 * this.spriteManager.tilesetSize, 0.2 * this.spriteManager.tilesetSize);
      this.entitySprites[entity.name].shadow.endFill();
      this.entityContainer.addChild(this.entitySprites[entity.name].shadow);

      // Sprite
      this.entitySprites[entity.name].sprite = new AnimatedSprite(this.spriteManager.animations[entity.spriteId]);
      this.entitySprites[entity.name].sprite.anchor.set(0.5);
      this.entitySprites[entity.name].sprite.animationSpeed = 0.2;
      this.entityContainer.addChild(this.entitySprites[entity.name].sprite);

      // Name
      this.entitySprites[entity.name].name = new Text(showName ? entity.name : '', { fontFamily: 'MatchupPro', fontSize: 16, fill: 0xffffff88, align: 'center' });
      this.entitySprites[entity.name].name.anchor.set(0.5);
      this.entitySprites[entity.name].name.scale.set(0.25);
      this.entityContainer.addChild(this.entitySprites[entity.name].name);
    }

    const coord = CoordHelper.getClosestCoord(entity.coord);
    if (!isHiding && CellHelper.isHiding(cells[coord.x][coord.y])) {
      if (this.entitySprites[entity.name].sprite.alpha == 1.0 && !hasJustBeenAdded) {
        this.soundManager.play(Sound.Bush);
        this.particleRenderService.addLeafStaticEmitter(entity.coord);
      }
      this.entitySprites[entity.name].sprite.alpha = 0.1; //TODO: maybe just remove it
      this.entitySprites[entity.name].name.alpha = 0;
      this.entitySprites[entity.name].shadow.alpha = 0;
    } else {
      if (this.entitySprites[entity.name].sprite.alpha == 0.1 && !hasJustBeenAdded) {
        this.soundManager.play(Sound.Bush);
        this.particleRenderService.addLeafStaticEmitter(entity.coord);
      }
      this.entitySprites[entity.name].sprite.alpha = 1.0;
      this.entitySprites[entity.name].name.alpha = 1.0;
      this.entitySprites[entity.name].shadow.alpha = 1.0;
    }

    if (isTargetted) {
      this.entitySprites[entity.name].sprite.tint = 0xffaaaa;
    } else {
      this.entitySprites[entity.name].sprite.tint = 0xffffff;
    }

    const direction = { x: entity.coord.x - previousEntityPosition.x, y: entity.coord.y - previousEntityPosition.y };
    if (direction.x > 0) {
      this.entitySprites[entity.name].sprite.scale.x = 1;
    } else if (direction.x < 0) {
      this.entitySprites[entity.name].sprite.scale.x = -1;
    }

    if (entity.isDashing && this.entitySprites[entity.name].sprite.textures != this.spriteManager.animations[entity.spriteId + 100]) {
      this.entitySprites[entity.name].sprite.textures = this.spriteManager.animations[entity.spriteId + 100];
    } else if (this.entitySprites[entity.name].sprite.textures != this.spriteManager.animations[entity.spriteId]) {
      this.entitySprites[entity.name].sprite.textures = this.spriteManager.animations[entity.spriteId];
    }

    if (direction.x == 0 && direction.y == 0) {
      this.entitySprites[entity.name].sprite.gotoAndStop(0);
    } else {
      this.entitySprites[entity.name].sprite.play();
    }

    this.entitySprites[entity.name].sprite.x = (MathHelper.lerp(previousEntityPosition.x, entity.coord.x, interpolFactor) + 0.5) * this.spriteManager.tilesetSize;
    this.entitySprites[entity.name].sprite.y = (MathHelper.lerp(previousEntityPosition.y, entity.coord.y, interpolFactor) + 0.5) * this.spriteManager.tilesetSize;
    this.entitySprites[entity.name].name.x = (MathHelper.lerp(previousEntityPosition.x, entity.coord.x, interpolFactor) + 0.5) * this.spriteManager.tilesetSize;
    this.entitySprites[entity.name].name.y = (MathHelper.lerp(previousEntityPosition.y, entity.coord.y, interpolFactor) - 0.3) * this.spriteManager.tilesetSize;
    this.entitySprites[entity.name].shadow.x = (MathHelper.lerp(previousEntityPosition.x, entity.coord.x, interpolFactor) + 0.5) * this.spriteManager.tilesetSize;
    this.entitySprites[entity.name].shadow.y = (MathHelper.lerp(previousEntityPosition.y, entity.coord.y, interpolFactor) + 1) * this.spriteManager.tilesetSize;
  }

  public renderCharacter(character: Entity, isHiding: boolean, direction: Coord) {
    if (!this.characterSprite) {
      // Sprite
      this.characterSprite = new AnimatedSprite(this.spriteManager.animations[character.spriteId]);
      this.characterSprite.anchor.set(0.5);
      this.characterSprite.zIndex = 1;
      this.characterSprite.animationSpeed = 0.2;
      this.characterSprite.play();
      this.mapContainer.addChild(this.characterSprite);

      // Shadow
      this.characterShadow = new Graphics();
      this.characterShadow.beginFill(0x000000, 0.5);
      this.characterShadow.drawEllipse(0, 0, 0.5 * this.spriteManager.tilesetSize, 0.2 * this.spriteManager.tilesetSize);
      this.characterShadow.endFill();
      this.entityContainer.addChild(this.characterShadow);
    }

    if (character.pv <= 0 && !this.deadCharacterSprite) {
      this.characterSprite.destroy();
      this.deadCharacterSprite = new Sprite(this.spriteManager.textures[19]);
      this.deadCharacterSprite.anchor.set(0.5);
      this.mapContainer.addChild(this.deadCharacterSprite);
    }

    // If dead
    if (character.pv <= 0) {
      // Direction
      if (direction.x > 0) {
        this.deadCharacterSprite.scale.x = -1;
      } else if (direction.x < 0) {
        this.deadCharacterSprite.scale.x = 1;
      }

      this.deadCharacterSprite.x = (character.coord.x + 0.5) * this.spriteManager.tilesetSize;
      this.deadCharacterSprite.y = (character.coord.y + 0.5) * this.spriteManager.tilesetSize;
    } else {
      if (character.isDashing && this.characterSprite.textures != this.spriteManager.animations[character.spriteId + 100]) {
        this.characterSprite.textures = this.spriteManager.animations[character.spriteId + 100];
      } else if (this.characterSprite.textures != this.spriteManager.animations[character.spriteId]) {
        this.characterSprite.textures = this.spriteManager.animations[character.spriteId];
      }

      // Animation
      if (direction.x == 0 && direction.y == 0) {
        this.characterSprite.gotoAndStop(0);
      } else {
        this.characterSprite.play();
      }

      // Direction
      if (direction.x > 0) {
        this.characterSprite.scale.x = 1;
      } else if (direction.x < 0) {
        this.characterSprite.scale.x = -1;
      }

      if (isHiding) {
        if (this.characterSprite.alpha == 1.0) {
          this.soundManager.play(Sound.Bush);
          this.particleRenderService.addLeafStaticEmitter(character.coord);
        }
        this.characterSprite.alpha = 0.5;
      } else {
        if (this.characterSprite.alpha == 0.5) {
          this.soundManager.play(Sound.Bush);
          this.particleRenderService.addLeafStaticEmitter(character.coord);
        }
        this.characterSprite.alpha = 1.0;
      }

      this.characterSprite.x = (character.coord.x + 0.5) * this.spriteManager.tilesetSize;
      this.characterSprite.y = (character.coord.y + 0.5) * this.spriteManager.tilesetSize;

      this.characterShadow.x = (character.coord.x + 0.5) * this.spriteManager.tilesetSize;
      this.characterShadow.y = (character.coord.y + 1) * this.spriteManager.tilesetSize;
    }
  }

  public renderEffects(character: Player, isHiding: boolean, delta: number) {
    this.lightRenderService.render(character, isHiding);
    this.particleRenderService.render(delta);
  }

  public renderInventory(character: Entity) {
    if (!this.inventoryBg) {
      this.inventoryBg = new Sprite();
      this.inventoryBg.texture = this.spriteManager.inventoryBgTexture;
      this.inventoryBg.x = 2;
      this.inventoryBg.y = 18 * this.spriteManager.tilesetSize - 5;
      this.inventoryContainer.addChild(this.inventoryBg);
    }

    let i = 0;
    for (; i < character.inventory.length; i++) {
      let item = character.inventory[i];
      if (!this.inventorySprites[i]) {
        this.inventorySprites[i] = new Sprite();
        this.inventorySprites[i].x = 3 + (i) * (this.spriteManager.tilesetSize + 4);
        this.inventorySprites[i].y = 18 * this.spriteManager.tilesetSize - 4;
        this.inventoryContainer.addChild(this.inventorySprites[i]);
        this.inventorySprites[i].interactive = true;

        this.inventoryIndexes[i] = new Text(String(i + 1), { fontFamily: 'MatchupPro', fontSize: 16, fill: 0xffffff, align: 'center' });
        this.inventoryIndexes[i].x = 3 + (i) * (this.spriteManager.tilesetSize + 4);
        this.inventoryIndexes[i].y = 18 * this.spriteManager.tilesetSize - 4;
        this.inventoryIndexes[i].scale.set(0.25);
        this.inventoryContainer.addChild(this.inventoryIndexes[i]);

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

      this.inventoryContainer.removeChild(this.inventoryIndexes[j]);
      delete this.inventoryIndexes[j];
      this.inventoryIndexes.pop();
    }
  }

  public renderPv(character: Entity) {
    if (this.pvSprites.length == 0) {
      for (let i = 0; i < character.maxPv; i++) {
        this.pvSprites[i] = new Sprite();
        this.pvSprites[i].x = (i + 16) * this.spriteManager.tilesetSize - 4;
        this.pvSprites[i].y = 18 * this.spriteManager.tilesetSize - 4;
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

  public renderGameState(role: Role, timestampDiff: number, nbSecInCurrentGameMode: number) {
    if (!this.musicSprite) {
      this.musicSprite = new Sprite();
      this.musicSprite.texture = this.spriteManager.textures[109];
      this.musicSprite.x = 2;
      this.musicSprite.y = 2;
      this.musicSprite.interactive = true;

      this.musicSprite.off('mousedown');
      this.musicSprite.on('mousedown',
        (_: any) => {
          if (this.soundManager.isMusicPlaying)
            this.soundManager.stopMusic();
          else
            this.soundManager.playMusic();
        }
      );

      this.pvContainer.addChild(this.musicSprite);
    }

    if (this.soundManager.isMusicPlaying) {
      this.musicSprite.texture = this.spriteManager.textures[109];
    } else {
      this.musicSprite.texture = this.spriteManager.textures[119];
    }

    if (!this.roleSprite) {
      this.roleSprite = new Sprite();
      if (role == Role.Bad)
        this.roleSprite.texture = this.spriteManager.textures[128];
      else
        this.roleSprite.texture = this.spriteManager.textures[129];
      this.roleSprite.x = 142;
      this.roleSprite.y = 2;
      this.pvContainer.addChild(this.roleSprite);
    }
    if (!this.roleText) {
      this.roleText = new Text('', { fontFamily: 'MatchupPro', fontSize: 32, fill: 0xffffff, align: 'center' });
      this.roleText.x = 126;
      this.roleText.y = 3;
      this.roleText.scale.set(0.25);
      this.pvContainer.addChild(this.roleText);
    }
    let secondsRemaining = nbSecInCurrentGameMode - Math.floor(timestampDiff / 1000);
    const sec = secondsRemaining % 60;
    const min = Math.floor(secondsRemaining / 60);
    this.roleText.text = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  public renderMap(cells: Cell[][], currentPlayer: Player, players: { [name: string]: Player }, entities: { [name: string]: Entity }, entitiesPreviousCoords: { [name: string]: Coord }, entityInRangeName: string, isHiding: boolean, interpolFactor: number) {
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

          if (!isHiding && CellHelper.isHiding(cells[i][j])) {
            itemCell.alpha = 0.6;
          } else {
            itemCell.alpha = 1.0;
          }
        }
      }
    }

    this.mapContainer.x =
      (9 - playerPosition.x) * this.spriteManager.tilesetSize;
    this.mapContainer.y =
      (9 - playerPosition.y) * this.spriteManager.tilesetSize;

    for (let entityName in entities) {
      this.renderEntity(entities[entityName], playerPosition, entitiesPreviousCoords[entityName], interpolFactor, cells, entityInRangeName == entityName, isHiding, false);
    }

    for (let playerName in players) {
      if (playerName != currentPlayer.entity.name)
        this.renderEntity(players[playerName].entity, playerPosition, entitiesPreviousCoords[playerName], interpolFactor, cells, entityInRangeName == playerName, isHiding, true);
    }

    // If players or entites have been removed from list we need to clean them
    for (let entitySpriteName in this.entitySprites) {
      if (!players[entitySpriteName] && !entities[entitySpriteName]) {
        this.entityContainer.removeChild(this.entitySprites[entitySpriteName].sprite);
        this.entityContainer.removeChild(this.entitySprites[entitySpriteName].name);
        this.entityContainer.removeChild(this.entitySprites[entitySpriteName].shadow);
        delete this.entitySprites[entitySpriteName];
      }
    }
  }
}