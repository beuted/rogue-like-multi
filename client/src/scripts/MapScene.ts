import { Application, Container } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { SoundManager } from "./SoundManager";
import { Map } from "./Map";
import { Character } from "./Character";
import { InputManager } from "./InputManager";
import { SocketClient } from "./SocketClient";
import { GameServerClient } from "./GameServerClient";
import { RenderService } from "./RenderService";

export class MapScene {
  private spriteManager: SpriteManager;
  private soundManager: SoundManager;
  private map: Map;
  private character: Character;
  private inputManager: InputManager;
  private socketClient: SocketClient;

  private state: GameState = GameState.Pause;
  private gameServerClient: GameServerClient;
  private renderService: RenderService;

  constructor(private app: Application) {
    this.spriteManager = new SpriteManager(this.app.loader, "assets/kenney_microroguelike_1.1/Tilemap/colored_tilemap.png", 9, 10, 10);
    this.soundManager = new SoundManager(this.app.loader, 'sounds/musical.mp3');
    this.socketClient = new SocketClient();
    this.renderService = new RenderService(this.spriteManager);
    this.map = new Map(this.spriteManager, this.socketClient, this.renderService);
    this.character = new Character(this.spriteManager, this.socketClient);
    this.inputManager = new InputManager();
    this.gameServerClient = new GameServerClient();
  }

  public async init() {
    await this.socketClient.init();
    await this.spriteManager.init();
    await this.soundManager.init();
    this.inputManager.init();

    //this.soundManager.play();

    console.log("Everything initialized");

    // Set state
    this.state = GameState.Play;

    // Display stuff
    let sceneContainer = new Container();
    sceneContainer.scale.set(4);
    let mapContainer = new Container();
    sceneContainer.addChild(mapContainer);
    this.renderService.init(mapContainer)

    var gameState = await this.gameServerClient.getState();
    this.map.init(mapContainer, gameState.mapStateStatic.map.cells);

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
    this.map.render();
    this.character.render();
  }
}

enum GameState {
  Pause = 0,
  Play = 1,
}