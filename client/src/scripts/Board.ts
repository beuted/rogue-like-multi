import { Cell, CellHelper, ItemType, FloorType } from "./Cell";
import { Entity, EntityType } from "./Entity";
import { Coord } from "./Coord";
import { Input, InputType } from "./InputManager";


export class Player {
  inputSequenceNumber: number;
  entity: Entity;
  role: Role;
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

export type GameConfigStringPpties = "nbSecsPerCycle" | "nbSecsDiscuss" | "badGuyVision" | "nbMaterialToWin" | "playerSpeed" | "entitySpeed" | "nbBadGuys" | "entityAggroDistance";

export type LootTable = {
  loot: { [key in ItemType]: number }
}

export type GameConfig = {
  nbSecsPerCycle: number;
  nbSecsDiscuss: number;
  badGuyVision: number;
  nbMaterialToWin: number;
  playerSpeed: number;
  entitySpeed: number;
  nbBadGuys: number;
  entityAggroDistance: number;
  itemSpawn: { [key in ItemType]: number };
  entitySpawn: { [key in EntityType]: number };
  entityLoot: { [key in EntityType]: LootTable };
  chestLoot: LootTable;
}

export enum ActionEventType {
  Attack = 0,
  VoteResult = 1,
  EndGame = 2,
  ShieldBreak = 3,
  Heal = 4,
  FlashIn = 5,
  FlashOut = 6
}

export type AttackEvent = {
  type: ActionEventType.Attack,
  timestamp: number,
  guid: string,
  coord: Coord,
}
export type HealEvent = {
  type: ActionEventType.Heal,
  timestamp: number,
  guid: string,
  coord: Coord,
}
export type ShieldBreakEvent = {
  type: ActionEventType.ShieldBreak,
  timestamp: number,
  guid: string,
  coord: Coord,
}
export type FlashInEvent = {
  type: ActionEventType.FlashIn,
  timestamp: number,
  guid: string,
  coord: Coord,
}
export type FlashOutEvent = {
  type: ActionEventType.FlashOut,
  timestamp: number,
  guid: string,
  coord: Coord,
}
export type VoteResultEvent = {
  type: ActionEventType.VoteResult,
  timestamp: number,
  guid: string,
  playerName: string,
  coord: null
}

export type EndGameEvent = {
  type: ActionEventType.EndGame,
  timestamp: number,
  guid: string,
  winnerTeam: Role
  coord: null
}

export type ActionEvent = AttackEvent | ShieldBreakEvent | EndGameEvent | VoteResultEvent | HealEvent | FlashInEvent | FlashOutEvent

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
    cells: Cell[][],
    items: { [key: string]: ItemType },
    changingFloors: { [key: string]: FloorType },
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
  public winnerTeam: Role = Role.None;
  public lastUpdateTime: number = null;
  public nowTimestamp: number;
  public startTimestamp: number;
  public gameStatus: GameStatus = GameStatus.Prepare;
  public gameConfig: GameConfig;
  public nightState: NightState

  private previousChangingFloor: { [key: string]: FloorType } = {};
  private previousItems: { [key: string]: ItemType } = {};

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

    if (boardStateDynamic.map.cells) // case of the init
      this.cells = boardStateDynamic.map.cells;
    else  // case of the update
      this.updateCells(boardStateDynamic.map.changingFloors, boardStateDynamic.map.items)

    this.player = boardStateDynamic.players[this.player.entity.name];
    this.winnerTeam = boardStateDynamic.winnerTeam;
    this.nowTimestamp = boardStateDynamic.nowTimestamp;
    this.startTimestamp = boardStateDynamic.startTimestamp;
    this.gameStatus = boardStateDynamic.gameStatus;
    this.nightState = boardStateDynamic.nightState;
  }

  private findValidCellMove(input: Input, hasKey: boolean, isDead: boolean, isDashing: boolean): Coord {
    var factor = isDashing ? 1.5 : 1;
    let newX = this.player.entity.coord.x + input.direction.x * input.pressTime * factor;
    let newY = this.player.entity.coord.y + input.direction.y * input.pressTime * factor;

    if (!this.isWalkable(Math.floor(newX + 0.5), Math.floor(newY + 0.5), hasKey, isDead)) {
      newX = this.player.entity.coord.x + input.direction.x * input.pressTime;
      newY = this.player.entity.coord.y;
      if (!this.isWalkable(Math.floor(newX + 0.5), Math.floor(newY + 0.5), hasKey, isDead)) {
        newX = this.player.entity.coord.x;
        newY = this.player.entity.coord.y + input.direction.y * input.pressTime;
        if (!this.isWalkable(Math.floor(newX + 0.5), Math.floor(newY + 0.5), hasKey, isDead)) {
          return null;
        }
      }
    }
    return { x: newX, y: newY };
  }

  public applyInput(input: Input) {
    let hasKey = this.player.entity.inventory.indexOf(ItemType.Key) != -1;
    let isDead = this.player.entity.pv <= 0;
    let newCoord = this.findValidCellMove(input, hasKey, isDead, this.player.entity.isDashing);
    if (newCoord == null)
      return;

    this.player.entity.coord = newCoord;
    if (input.type == InputType.Attack)
      this.player.entity.coolDownAttack = input.time + 1500; // The server will have caught up after 1500 ms

    if (input.type == InputType.Dash) {
      this.player.entity.coolDownDash = input.time + 1500; // The server will have caught up after 1500 ms
      //this.player.entity.isDashing = true;
    }

    if (input.type == InputType.Flash) {
      this.player.entity.coolDownDash = input.time + 1500; // The server will have caught up after 1500 ms
      //this.player.entity.isDashing = true;
    }
  }

  isWalkable(x: number, y: number, hasKey: boolean, isDead: boolean) {
    return x >= 0 && y >= 0 && x <= this.mapLength - 1 && y <= this.mapLength - 1 && (isDead || CellHelper.isWalkable(this.cells[x][y], hasKey));
  }

  private computeEntitiesPreviousCoord() {
    this.entitiesPreviousCoords = {};
    for (var entityName in this.entities)
      this.entitiesPreviousCoords[entityName] = this.entities[entityName].coord;
    for (var playerName in this.players)
      this.entitiesPreviousCoords[playerName] = this.players[playerName].entity.coord;
  }

  private updateCells(changingFloors: { [key: string]: FloorType }, items: { [key: string]: ItemType }) {
    // Clean based on previous changing floor
    for (let key in this.previousChangingFloor) {
      let commaPos = key.indexOf(',');
      const x = Number(key.substr(0, commaPos));
      const y = Number(key.substr(commaPos + 1, key.length - 1));
      this.cells[x][y].floorType = FloorType.Plain;
    }

    // Add new floors
    for (let key in changingFloors) {
      let commaPos = key.indexOf(',');
      const x = Number(key.substr(0, commaPos));
      const y = Number(key.substr(commaPos + 1, key.length - 1));
      this.cells[x][y].floorType = changingFloors[key];
    }

    // Clean based on previous items
    for (let key in this.previousItems) {
      let commaPos = key.indexOf(',');
      const x = Number(key.substr(0, commaPos));
      const y = Number(key.substr(commaPos + 1, key.length - 1));
      this.cells[x][y].itemType = ItemType.Empty;
    }

    // Add new items
    for (let key in items) {
      let commaPos = key.indexOf(',');
      const x = Number(key.substr(0, commaPos));
      const y = Number(key.substr(commaPos + 1, key.length - 1));
      this.cells[x][y].itemType = items[key];
    }

    // Update local cache of previous values
    this.previousChangingFloor = changingFloors;
    this.previousItems = items;
  }
}