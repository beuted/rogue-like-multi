import { Container, Sprite } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { SocketClient, SocketMessageSent } from "./SocketClient";

//TODO: Class should not be a model and a service
export class Character {
  public x: number = 0;
  public y: number = 0;
  public username: string = null;

  private spriteId = 5;
  private cell: Sprite;

  constructor(private spriteManager: SpriteManager, private socketClient: SocketClient) {
  }

  public init(container: Container, username: string) {
    this.username = username;
    this.cell = new Sprite(this.spriteManager.textures[this.spriteId]);
    container.addChild(this.cell);
  }

  public move(vx: number, vy: number) {
    this.x += vx;
    this.y += vy;
    this.socketClient.SendMessage(SocketMessageSent.Move, this.username, this.x, this.y);
  }

  public render() {
    this.cell.x = this.x*this.spriteManager.tilesetSize;
    this.cell.y = this.y*this.spriteManager.tilesetSize;
  }
}