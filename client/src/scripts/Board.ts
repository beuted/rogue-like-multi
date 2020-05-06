import { Cell, CellHelper } from "./Cell";
import { Entity } from "./Entity";
import { Coord } from "./Coord";


export class Player {
  lastAction: number;
  entity: Entity;
}

export enum Team {
  None = 0,
  Good = 1,
  Evil = 2
}

export type GameState = {
  boardStateDynamic: BoardStateDynamic;
  boardStateStatic: {};
}

export type BoardStateDynamic = {
  players: {[name: string]: Player};
  entities: {[name: string]: Entity};
  map: {
    cells: Cell[][];
  };
  nbBagsFound: number,
  winnerTeam: Team
}

export class Board {
  public cells: Cell[][] = [];
  public entities: { [name: string]: Entity } = {};
  public players: { [name: string]: Player } = {};
  public entitiesPreviousCoords: { [name: string]: Coord } = {}; // Could be stored at the renderservice level
  public player: Player;
  public nbBagsFound: number = 0;
  public winnerTeam: Team = Team.None;
  public lastUpdateTime: number = null;

  constructor() {
  }

  public init(gameState: GameState, username: string) {
    // Init map grid
    this.cells = gameState.boardStateDynamic.map.cells;
    if (gameState.boardStateDynamic.players) {
      var player = gameState.boardStateDynamic.players[username];
      if (player)
        this.player = player;
    }
  }

  public update(boardStateDynamic: BoardStateDynamic): number {
    const playerLastAction = boardStateDynamic.players[this.player.entity.name].lastAction;
    this.computeEntitiesPreviousCoord();
    this.lastUpdateTime = Date.now();

    this.entities = boardStateDynamic.entities;
    this.players = boardStateDynamic.players;
    this.cells = boardStateDynamic.map.cells;
    this.player = boardStateDynamic.players[this.player.entity.name];
    this.winnerTeam = boardStateDynamic.winnerTeam;
    this.nbBagsFound = boardStateDynamic.nbBagsFound;
    console.log("update ", this.player.lastAction);

    return playerLastAction;
  }

  isWalkable(coord: Coord) {
    return CellHelper.isWalkable(this.cells[coord.x][coord.y]);
  }

  private computeEntitiesPreviousCoord() {
    this.entitiesPreviousCoords = {};
    for (var entityName in this.entities)
      this.entitiesPreviousCoords[entityName] = this.entities[entityName].coord;
    for (var playerName in this.players)
      this.entitiesPreviousCoords[playerName] = this.players[playerName].entity.coord;
  }
}