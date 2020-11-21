import { Application } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { SoundManager } from "./SoundManager";
import { Board, BoardStateDynamic, GameStatus, GameState, Role } from "./Board";
import { InputManager, Input } from "./InputManager";
import { SocketClient, SocketMessageReceived } from "./SocketClient";
import { GameServerClient } from "./GameServerClient";
import { RenderService } from "./RenderService";
import { CharacterController } from "./CharacterController";
import { ChatController } from "./ChatController";
import { LightRenderService } from "./LightRenderService";
import { InitGameModalController } from "./InitGameModalController";
import { ParticleRenderService } from "./ParticleRenderService";
import { EventHandler } from "./EventHandler";
import { NightOverlayController } from "./NightOverlayController";

export class BoardScene {
  private spriteManager: SpriteManager;
  private soundManager: SoundManager;
  private board: Board;
  private inputManager: InputManager;
  private socketClient: SocketClient;

  private gameServerClient: GameServerClient;
  private lightRenderService: LightRenderService;
  private particleRenderService: ParticleRenderService;
  private renderService: RenderService;
  private characterController: CharacterController;
  private eventHandler: EventHandler;

  private initGameModalController: InitGameModalController;
  private nightOverlayController: NightOverlayController;

  private pendingInputs: Input[] = [];

  constructor(private app: Application) {
    this.spriteManager = new SpriteManager(this.app.loader, "assets/colored_tilemap.png", 9, 10, 10);
    this.soundManager = new SoundManager(this.app.loader, 'sounds/musical.mp3');
    this.socketClient = new SocketClient();
    this.lightRenderService = new LightRenderService(this.spriteManager);
    this.particleRenderService = new ParticleRenderService(this.spriteManager);
    this.renderService = new RenderService(this.spriteManager, this.lightRenderService, this.particleRenderService);
    this.board = new Board();
    this.inputManager = new InputManager();
    this.gameServerClient = new GameServerClient();
    this.characterController = new CharacterController(this.socketClient)
    this.initGameModalController = new InitGameModalController(this.gameServerClient);
    this.nightOverlayController = new NightOverlayController(this.inputManager, this.characterController);
    this.eventHandler = new EventHandler(this.particleRenderService);
  }

  public async init() {
    var user = await this.gameServerClient.authenticate();
    if (user == null)
      return;

    await this.socketClient.init(user);
    await this.spriteManager.init();
    await this.soundManager.init();
    this.inputManager.init();

    // HTML UI controllers
    this.initGameModalController.init();
    this.nightOverlayController.init();

    //this.soundManager.play();

    console.log("Everything initialized");

    // Display stuff
    const sceneContainer = this.renderService.init();
    this.app.stage.addChild(sceneContainer);

    // Called once for init
    this.socketClient.registerListener(SocketMessageReceived.InitBoardState, (gameState: GameState) => {
      this.board.init(gameState, user.username);
      this.initGameModalController.showComponent(false);
    });

    this.socketClient.registerListener(SocketMessageReceived.SetBoardStateDynamic, (boardStateDynamic: BoardStateDynamic) => {
      this.board.update(boardStateDynamic);
      this.eventHandler.update(boardStateDynamic.events);

      // Server Reconciliation. Re-apply all the inputs not yet processed by
      // the server.
      let j = 0;
      while (j < this.pendingInputs.length) {
        var input = this.pendingInputs[j];
        if (input.inputSequenceNumber <= this.board.player.inputSequenceNumber) {
          // Already processed. Its effect is already taken into account into the world update
          // we just got, so we can drop it.
          this.pendingInputs.splice(j, 1);
        } else {
          // Not processed by the server yet. Re-apply it.
          this.board.applyInput(input);
          j++;
        }
      }
    });

    // We start after registering listeners !
    this.socketClient.start();

    var chatController = new ChatController(this.socketClient);

    chatController.init(document.getElementById('chat-box'), (message) => this.characterController.talk(message));

    // Game loop

    this.app.ticker.add((delta: number) => this.gameLoop(delta));
  }

  private gameLoop(delta: number) {
    this.play(delta)

    // In case of victory (a bit hacky)
    if (this.board.winnerTeam != Role.None) {
      this.gameServerClient.resetGame();
      window.alert(`${this.board.winnerTeam == Role.Good ? 'The villagers' : 'The werewoves'} won the game !`);
      this.board.winnerTeam = Role.None
      location.reload();
    }
  }

  private play(delta: number) {
    switch (this.board.gameStatus) {
      case GameStatus.Prepare:
        this.initGameModalController.showComponent(true);
        break;
      case GameStatus.Play:
        const speed = 0.04;
        let input = this.inputManager.get(this.board.player.coolDownAttack, this.board.player.role, parseFloat((delta * speed).toFixed(3)));

        // TODO: Cooldown coté client pour l'attack ? ou coté server ?
        if ((input.direction.x != 0 || input.direction.y != 0 || input.attack)) {
          this.characterController.sendInput(input);

          // Apply the inputs will be overriden by the server when we receive a notif from it
          this.board.applyInput(input);

          // Save this input for later reconciliation.
          this.pendingInputs.push(input);
        }

        // Render
        var interpolFactor = (Date.now() - this.board.lastUpdateTime) / 300; // 300 is the time between server update
        this.renderService.renderMap(this.board.cells, this.board.player, this.board.players, this.board.entities, this.board.entitiesPreviousCoords, interpolFactor)
        this.renderService.renderCharacter(this.board.player.entity);
        this.renderService.renderInventory(this.board.player.entity);
        this.renderService.renderPv(this.board.player.entity);
        this.renderService.renderGameState(this.board.player.role, this.board.nowTimestamp - this.board.startTimestamp);
        this.renderService.renderEffects(this.board.player.entity, this.board.nowTimestamp - this.board.startTimestamp, this.board.gameConfig.nbSecsPerCycle);

        this.nightOverlayController.show(false);
        break;
      case GameStatus.Discuss:
        this.renderService.renderGameState(this.board.player.role, this.board.nowTimestamp - this.board.startTimestamp);
        this.nightOverlayController.show(true);
        this.nightOverlayController.render(this.board.player.entity.name, this.board.nightState, Object.values(this.board.players).map(x => x.entity));
        break;
      case GameStatus.Pause:
        break;
    }
  }
}