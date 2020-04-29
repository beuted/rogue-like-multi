import { Cell } from "./Cell";
import { Container, Sprite } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { Entity } from "./Entity";
import { SocketClient, SocketMessageReceived } from "./SocketClient";
import { RenderService } from "./RenderService";

export class Map {
  private size: number = 20
  private cells: Cell[][] = [];
  private entities: {[name: string]: Entity} = {};

  constructor(private spriteManager: SpriteManager, private socketClient: SocketClient, private renderService: RenderService) {
  }

  public init(container: Container, cells: Cell[][]) {
    // Init map grid
    this.cells = cells;

    // Init map sprites (will never move)
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let cell = new Sprite(this.spriteManager.textures[this.cells[i][j].floorType]);
        cell.x = i*this.spriteManager.tilesetSize;
        cell.y = j*this.spriteManager.tilesetSize;
        container.addChild(cell);
      }
    }

    // Watch for entities moves
    this.socketClient.registerListener(SocketMessageReceived.SetMapStateDynamic, (mapStateDynamic) => {
      this.entities = mapStateDynamic.entities;
      for (let entityName in this.entities) {
        this.renderService.renderEntity(this.entities[entityName]);
      }
    });
  }

  public render() {
    /*for (let entityName in this.entities) {
      this.renderService.renderEntity(this.entities[entityName]);
    }*/
  }
}