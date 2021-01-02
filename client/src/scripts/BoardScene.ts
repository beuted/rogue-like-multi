import { Application } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { SoundManager } from "./SoundManager";
import { Board, BoardStateDynamic, GameStatus, Role } from "./Board";
import { InputManager, Input, InputType } from "./InputManager";
import { SocketClient, SocketMessageReceived } from "./SocketClient";
import { GameServerClient } from "./GameServerClient";
import { RenderService } from "./RenderService";
import { CharacterController } from "./CharacterController";
import { LightRenderService } from "./LightRenderService";
import { ParticleRenderService } from "./ParticleRenderService";
import { EventHandler } from "./EventHandler";
import { CellHelper } from "./Cell";
import { CoordHelper } from "./Coord";

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

  private pendingInputs: Input[] = [];
  guiController: GuiController;

  constructor(private app: Application, gameServerClient: GameServerClient, socketClient: SocketClient, inputManager: InputManager, characterController: CharacterController, board: Board, guiController: GuiController) {
    this.socketClient = socketClient;
    this.gameServerClient = gameServerClient;
    this.inputManager = inputManager;
    this.characterController = characterController;
    this.board = board;
    this.guiController = guiController;

    this.spriteManager = new SpriteManager(this.app.loader, "assets/v2.png", 9, 11, 10);
    this.soundManager = new SoundManager(this.app.loader, 'sounds/musical.mp3');
    this.lightRenderService = new LightRenderService(this.spriteManager);
    this.particleRenderService = new ParticleRenderService(this.spriteManager);
    this.renderService = new RenderService(this.spriteManager, this.lightRenderService, this.particleRenderService);
    this.eventHandler = new EventHandler(this.particleRenderService);
  }

  public async init() {
    await this.spriteManager.init();
    await this.soundManager.init();
    this.inputManager.init();

    //this.soundManager.play();

    console.log("Everything initialized");

    // Display stuff
    const sceneContainer = this.renderService.init(this.board.cells);
    this.app.stage.addChild(sceneContainer);

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
        this.guiController.setShowGameModal(true);
        break;
      case GameStatus.Play:
        const speed = 0.04;
        let input = this.inputManager.get(this.board.player.coolDownAttack, this.board.player.role, this.board.player.entity.pv, parseFloat((delta * speed).toFixed(3)));

        // TODO: Cooldown coté client pour l'attack ? ou coté server ?
        if ((input.direction.x != 0 || input.direction.y != 0 || input.type == InputType.Attack)) {
          this.characterController.sendInput(input);

          // Apply the inputs will be overriden by the server when we receive a notif from it
          this.board.applyInput(input);

          // Save this input for later reconciliation.
          this.pendingInputs.push(input);
        }

        // Render
        var interpolFactor = (Date.now() - this.board.lastUpdateTime) / 300; // 300 is the time between server update
        const coord = CoordHelper.getClosestCoord(this.board.player.entity.coord);
        const isHiding = CellHelper.isHiding(this.board.cells[coord.x][coord.y]);

        this.renderService.renderMap(this.board.cells, this.board.player, this.board.players, this.board.entities, this.board.entitiesPreviousCoords, isHiding, interpolFactor);
        this.renderService.renderCharacter(this.board.player.entity, isHiding);
        this.renderService.renderInventory(this.board.player.entity);
        this.renderService.renderPv(this.board.player.entity);
        this.renderService.renderGameState(this.board.player.role, this.board.nowTimestamp - this.board.startTimestamp);
        this.renderService.renderEffects(this.board.player, this.board.nowTimestamp - this.board.startTimestamp, isHiding, this.board.gameConfig.nbSecsPerCycle);

        this.guiController.setShowNightOverlay(false);
        break;
      case GameStatus.Discuss:
        this.renderService.renderGameState(this.board.player.role, this.board.nowTimestamp - this.board.startTimestamp);
        this.guiController.setShowNightOverlay(true);
        break;
      case GameStatus.Pause:
        break;
    }
  }
}

export type GuiController = {
  setShowGameModal: React.Dispatch<React.SetStateAction<boolean>>,
  setShowNightOverlay: React.Dispatch<React.SetStateAction<boolean>>
}