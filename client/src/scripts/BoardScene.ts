import { Application, Container } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { SoundManager } from "./SoundManager";
import { Board } from "./Board";
import { InputManager } from "./InputManager";
import { SocketClient, SocketMessageReceived } from "./SocketClient";
import { GameServerClient } from "./GameServerClient";
import { RenderService } from "./RenderService";
import { CharacterController } from "./CharacterController";

export class BoardScene {
  private spriteManager: SpriteManager;
  private soundManager: SoundManager;
  private board: Board;
  private inputManager: InputManager;
  private socketClient: SocketClient;

  private state: GameState = GameState.Pause;
  private gameServerClient: GameServerClient;
  private renderService: RenderService;
  private characterController: CharacterController;

  constructor(private app: Application) {
    this.spriteManager = new SpriteManager(this.app.loader, "assets/kenney_microroguelike_1.1/Tilemap/colored_tilemap.png", 9, 10, 10);
    this.soundManager = new SoundManager(this.app.loader, 'sounds/musical.mp3');
    this.socketClient = new SocketClient();
    this.renderService = new RenderService(this.spriteManager);
    this.board = new Board(this.spriteManager, this.renderService);
    this.inputManager = new InputManager();
    this.gameServerClient = new GameServerClient();
    this.characterController = new CharacterController(this.socketClient)
  }

  public async init() {
    var user = await this.gameServerClient.authenticate();
    if (user == null)
      return;

    await this.socketClient.init(user);
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

    this.board.init(mapContainer, gameState, user.username);

    this.app.stage.addChild(sceneContainer);

    this.socketClient.registerListener(SocketMessageReceived.SetBoardStateDynamic, (boardStateDynamic) => {
      console.log('SetBoardStateDynamic');
      this.board.render(boardStateDynamic);
    });

    this.socketClient.registerListener(SocketMessageReceived.NewMessage, (message) => {
      console.log('message', message);
    });

    // Game loop

    this.app.ticker.add((delta: number) => this.gameLoop(delta));
  }

  private gameLoop(delta: number) {
    if (this.state == GameState.Play)
      this.play(delta)
  }

  private play(delta: number) {
    let direction = this.inputManager.get();
    if ((direction.x != 0 || direction.y != 0) && !this.board.player.hasPlayedThisTurn) {
      this.characterController.move(this.board.player, direction);
    } else if (!this.board.player.hasPlayedThisTurn) {
      this.characterController.talk(this.board.player, "pwet");
    }

    delta;
    this.renderService.renderCharacter(this.board.player.entity);
  }
}

enum GameState {
  Pause = 0,
  Play = 1,
}