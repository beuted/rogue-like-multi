import { Application, Container } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { SoundManager } from "./SoundManager";
import { Map } from "./Map";
import { Character } from "./Character";
import { InputManager } from "./InputManager";
import { SocketClient } from "./SocketClient";
import { Entity } from "./Entity";

export class MapScene {
  private spriteManager: SpriteManager;
  private soundManager: SoundManager;
  private map: Map;
  private character: Character;
  private inputManager: InputManager;
  private socketClient: SocketClient;

  private state: GameState = GameState.Pause;

  constructor(private app: Application) {
    this.spriteManager = new SpriteManager(this.app.loader, "assets/kenney_microroguelike_1.1/Tilemap/colored_tilemap.png", 9, 10, 10);
    this.soundManager = new SoundManager(this.app.loader, 'sounds/musical.mp3');
    this.map = new Map(this.spriteManager);
    this.socketClient = new SocketClient();
    this.character = new Character(this.spriteManager, this.socketClient);
    this.inputManager = new InputManager();
  }

  public async init() {
    await this.spriteManager.init();
    await this.soundManager.init();
    this.map.init();
    this.inputManager.init();
    await this.socketClient.init();

    //this.soundManager.play();

    console.log("Everything initialized");

    // Set state

    this.state = GameState.Play;

    // Display stuff


    let sceneContainer = new Container();
    sceneContainer.scale.set(4);
    let mapContainer = new Container();
    sceneContainer.addChild(mapContainer);

    this.map.render(mapContainer);
    let ent = new Entity(this.spriteManager);
    ent.init(mapContainer, "michel", 3, 3);
    this.map.addEntity(ent);


    this.character.init(mapContainer, "user" + Math.floor(Math.random()*100));

    this.app.stage.addChild(sceneContainer);

    // Game loop

    this.app.ticker.add((delta: number) => this.gameLoop(delta));
  }

  private gameLoop(delta: number) {
    if (this.state == GameState.Play)
      this.play(delta)
  }

  private play(delta: number) {
    let inputs = this.inputManager.get();
    if (inputs.vx != 0 || inputs.vy != 0)
      this.character.move(inputs.vx, inputs.vy);

    delta;
    this.character.render();
  }
}

enum GameState {
  Pause = 0,
  Play = 1,
}