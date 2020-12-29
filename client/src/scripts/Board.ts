import { Cell, CellHelper, ItemType } from "./Cell";
import { Entity } from "./Entity";
import { Coord } from "./Coord";
import { Input } from "./InputManager";


export class Player {
  inputSequenceNumber: number;
  entity: Entity;
  role: Role;
  coolDownAttack: number;
}

export enum Role {
  None = 0,
  Good = 1,
  Bad = 2
}

export enum GameStatus {
  Pause = 0,
  Play = 1,
  Discuss = 2,
  Prepare = 3
}

export type GameState = {
  boardStateDynamic: BoardStateDynamic;
  boardStateStatic: { gameConfig: GameConfig };
}

export type GameConfig = {
  nbSecsPerCycle: number;
  nbSecsDiscuss: number;
}

export enum ActionEventType {
  Attack = 0,
  VoteResult = 1,
}

export type ActionEvent = {
  type: ActionEventType,
  coord: Coord,
  playerName: string,
  timestamp: number
}

export type Vote = {
  from: string,
  for: string
}

export type Gift = {
  from: string
}

export type NightState = {
  votes: Vote[],
  foodGiven: Gift[],
  materialGiven: Gift[]
}

export type BoardStateDynamic = {
  players: { [name: string]: Player },
  entities: { [name: string]: Entity },
  events: ActionEvent[],
  nightState: NightState
  map: {
    cells: Cell[][]
  },
  nbBagsFound: number,
  winnerTeam: Role,
  nowTimestamp: number,
  startTimestamp: number,
  gameStatus: GameStatus
}

export class Board {
  public cells: Cell[][] = [];
  public mapLength: number;
  public entities: { [name: string]: Entity } = {};
  public players: { [name: string]: Player } = {};
  public entitiesPreviousCoords: { [name: string]: Coord } = {}; // Could be stored at the renderservice level
  public player: Player;
  public nbBagsFound: number = 0;
  public winnerTeam: Role = Role.None;
  public lastUpdateTime: number = null;
  public nowTimestamp: number;
  public startTimestamp: number;
  public gameStatus: GameStatus = GameStatus.Prepare;
  public gameConfig: GameConfig;
  public nightState: NightState

  constructor() {
  }

  public init(gameState: GameState, username: string) {
    // Init map grid
    this.gameConfig = gameState.boardStateStatic.gameConfig;
    this.mapLength = gameState.boardStateDynamic.map.cells.length;
    if (gameState.boardStateDynamic.players) {
      var player = gameState.boardStateDynamic.players[username];
      if (player)
        this.player = player;
    }

    this.update(gameState.boardStateDynamic);
  }

  public update(boardStateDynamic: BoardStateDynamic) {
    this.computeEntitiesPreviousCoord();
    this.lastUpdateTime = Date.now();

    this.entities = boardStateDynamic.entities;
    this.players = boardStateDynamic.players;
    this.cells = boardStateDynamic.map.cells;
    this.player = boardStateDynamic.players[this.player.entity.name];
    this.winnerTeam = boardStateDynamic.winnerTeam;
    this.nbBagsFound = boardStateDynamic.nbBagsFound;
    this.nowTimestamp = boardStateDynamic.nowTimestamp;
    this.startTimestamp = boardStateDynamic.startTimestamp;
    this.gameStatus = boardStateDynamic.gameStatus;
    this.nightState = boardStateDynamic.nightState;
  }

  private findValidCellMove(input: Input, hasKey: boolean): Coord {
    let newX = this.player.entity.coord.x + input.direction.x * input.pressTime;
    let newY = this.player.entity.coord.y + input.direction.y * input.pressTime;

    if (!this.isWalkable(Math.floor(newX + 0.5), Math.floor(newY + 0.5), hasKey)) {
      newX = this.player.entity.coord.x + input.direction.x * input.pressTime;
      newY = this.player.entity.coord.y;
      if (!this.isWalkable(Math.floor(newX + 0.5), Math.floor(newY + 0.5), hasKey)) {
        newX = this.player.entity.coord.x;
        newY = this.player.entity.coord.y + input.direction.y * input.pressTime;
        if (!this.isWalkable(Math.floor(newX + 0.5), Math.floor(newY + 0.5), hasKey)) {
          return null;
        }
      }
    }
    return { x: newX, y: newY };
  }

  public applyInput(input: Input) {
    let hasKey = this.player.entity.inventory.indexOf(ItemType.Key) != -1;
    let newCoord = this.findValidCellMove(input, hasKey);
    if (newCoord == null)
      return;

    this.player.entity.coord = newCoord;
    if (input.attack)
      this.player.coolDownAttack = input.time + 1500; // The server will have caught up after 1500 ms
  }

  isWalkable(x: number, y: number, hasKey: boolean) {
    return x >= 0 && y >= 0 && x <= this.mapLength - 1 && y <= this.mapLength - 1 && CellHelper.isWalkable(this.cells[x][y], hasKey);
  }

  private computeEntitiesPreviousCoord() {
    this.entitiesPreviousCoords = {};
    for (var entityName in this.entities)
      this.entitiesPreviousCoords[entityName] = this.entities[entityName].coord;
    for (var playerName in this.players)
      this.entitiesPreviousCoords[playerName] = this.players[playerName].entity.coord;
  }
}