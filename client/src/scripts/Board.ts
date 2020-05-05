import { Cell, CellHelper } from "./Cell";
import { Entity } from "./Entity";
import { Coord } from "./Coord";


export class Player {
  lastAction: number;
  entity: Entity;
}

type GameState = {
  boardStateDynamic: BoardStateDynamic;
  boardStateStatic: {};
}

export type BoardStateDynamic = {
  players: {[name: string]: Player};
  entities: {[name: string]: Entity};
  map: {
    cells: Cell[][];
  };
}

export class Board {
  public cells: Cell[][] = [];
  public entities: { [name: string]: Entity } = {};
  public players: { [name: string]: Player } = {};
  public player: Player;

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

  public update(boardStateDynamic: BoardStateDynamic): boolean {
    this.entities = boardStateDynamic.entities;
    this.players = boardStateDynamic.players;
    this.cells = boardStateDynamic.map.cells;
    const lastActionWasTakenIntoAccount = this.player.lastAction == boardStateDynamic.players[this.player.entity.name].lastAction || boardStateDynamic.players[this.player.entity.name].lastAction == null;
    this.player = boardStateDynamic.players[this.player.entity.name];
    console.log("update ", this.player.lastAction);
    return lastActionWasTakenIntoAccount;
  }

  isWalkable(coord: Coord) {
    return CellHelper.isWalkable(this.cells[coord.x][coord.y]);
  }
}