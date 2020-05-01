import { Cell } from "./Cell";
import { Container, Sprite } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { Entity } from "./Entity";
import { RenderService } from "./RenderService";


export class Player {
  hasPlayedThisTurn: boolean;
  entity: Entity;
}

class GameState {
  boardStateDynamic: {
    players: {[name: string]: Player};
    entities: {[name: string]: Entity};
  };
  boardStateStatic: {
    map: {
      cells: Cell[][];
    };
  };
}

export class Board {
  private size: number = 20
  private cells: Cell[][] = [];
  private entities: { [name: string]: Entity } = {};
  private players: { [name: string]: Player } = {};
  public player: Player;

  constructor(private spriteManager: SpriteManager, private renderService: RenderService) {
  }

  public init(container: Container, gameState: GameState, username: string) {
    // Init map grid
    this.cells = gameState.boardStateStatic.map.cells;
    if (gameState.boardStateDynamic.players) {
      var player = gameState.boardStateDynamic.players[username];
      if (player)
        this.player = player;
    }

    // Init map sprites (will never move)
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let cell = new Sprite(this.spriteManager.textures[this.cells[i][j].floorType]);
        cell.x = i*this.spriteManager.tilesetSize;
        cell.y = j*this.spriteManager.tilesetSize;
        container.addChild(cell);
      }
    }
  }

  //TODO: should the render set this entities and this.players ?
  public render(boardStateDynamic: any) {
    this.player.hasPlayedThisTurn = false;
    this.entities = boardStateDynamic.entities;
    for (let entityName in this.entities) {
      this.renderService.renderEntity(this.entities[entityName]);
    }
    this.players = boardStateDynamic.players;
    for (let playerName in this.players) {
      if (playerName != this.player.entity.name)
        this.renderService.renderEntity(this.players[playerName].entity);
    }
    //The render is done when we receive a SocketMessageReceived.SetMapStateDynamic
  }
}