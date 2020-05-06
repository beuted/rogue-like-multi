import { Application } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { SoundManager } from "./SoundManager";
import { Board, BoardStateDynamic, Team } from "./Board";
import { InputManager } from "./InputManager";
import { SocketClient, SocketMessageReceived } from "./SocketClient";
import { GameServerClient } from "./GameServerClient";
import { RenderService } from "./RenderService";
import { CharacterController } from "./CharacterController";
import { ChatController } from "./ChatController";

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

  private serverLastAction: number = null; // should be somewhere else... with the input handling

  constructor(private app: Application) {
    this.spriteManager = new SpriteManager(this.app.loader, "assets/colored_tilemap.png", 9, 10, 10);
    this.soundManager = new SoundManager(this.app.loader, 'sounds/musical.mp3');
    this.socketClient = new SocketClient();
    this.renderService = new RenderService(this.spriteManager);
    this.board = new Board();
    this.inputManager = new InputManager();
    this.gameServerClient = new GameServerClient();
    this.characterController = new CharacterController(this.socketClient, this.renderService)
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

    const sceneContainer = this.renderService.init();

    var gameState = await this.gameServerClient.getState();
    if (!gameState) {
      console.error("Could not fetch game state");
      return;
    }

    this.board.init(gameState, user.username);

    this.app.stage.addChild(sceneContainer);

    this.socketClient.registerListener(SocketMessageReceived.SetBoardStateDynamic, (boardStateDynamic: BoardStateDynamic) => {
      this.serverLastAction = this.board.update(boardStateDynamic);
    });

    var chatController = new ChatController(this.socketClient);

    chatController.init(document.getElementById('chat-box'), (message) => this.characterController.talk(this.board.player, message));

    // Game loop

    this.app.ticker.add((delta: number) => this.gameLoop(delta));
  }

  private playerLastActionWasTakenIntoAccount() {
    return this.serverLastAction == this.board.player.lastAction || this.board.player.lastAction == null;
  }

  private gameLoop(delta: number) {
    if (this.state == GameState.Play)
      this.play(delta)

    // In case of victory (a bit hacky)
    if (this.board.winnerTeam != Team.None) {
      this.gameServerClient.resetGame();
      window.alert(`${this.board.winnerTeam == Team.Good ? 'The villagers' : 'The werewoves'} won the game !`);
      this.board.winnerTeam = Team.None
      location.reload();
    }
  }

  private play(delta: number) {
    let input = this.inputManager.get();
    if (input.attack && this.playerLastActionWasTakenIntoAccount()) {
      this.characterController.attack(this.board.player);
    } else if ((input.direction.x != 0 || input.direction.y != 0) && this.playerLastActionWasTakenIntoAccount()) {
      var newPlayerPosition = {
        x: this.board.player.entity.coord.x + input.direction.x,
        y: this.board.player.entity.coord.y + input.direction.y
      }
      if (this.board.isWalkable(newPlayerPosition))
        this.characterController.move(this.board.player, newPlayerPosition);
    }

    delta;
    var interpolFactor = (Date.now() - this.board.lastUpdateTime) / 200; // 300 is the time between server update
    this.renderService.renderMap(this.board.cells, this.board.player, this.board.players, this.board.entities, this.board.entitiesPreviousCoords, interpolFactor)
    this.renderService.renderCharacter(this.board.player.entity);
    this.renderService.renderInventory(this.board.player.entity);
    this.renderService.renderPv(this.board.player.entity);
    this.renderService.renderGameState(this.board.nbBagsFound);
    this.renderService.renderEffects(this.board.player);
  }
}

enum GameState {
  Pause = 0,
  Play = 1,
}