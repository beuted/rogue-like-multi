import { Application } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { SoundManager } from "./SoundManager";
import { Board, BoardStateDynamic, GameStatus, Role, Player } from "./Board";
import { InputManager, Input, InputType } from "./InputManager";
import { SocketClient, SocketMessageReceived } from "./SocketClient";
import { GameServerClient } from "./GameServerClient";
import { RenderService } from "./RenderService";
import { CharacterController } from "./CharacterController";
import { LightRenderService } from "./LightRenderService";
import { ParticleRenderService } from "./ParticleRenderService";
import { EventHandler } from "./EventHandler";
import { CellHelper, Cell } from "./Cell";
import { CoordHelper } from "./Coord";
import { Entity } from "./Entity";
import * as FontFaceObserver from "fontfaceobserver"

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

    this.spriteManager = new SpriteManager(this.app.loader, 'assets/v3.png', 'assets/menu.png', 8, 25, 10);
    this.soundManager = new SoundManager(this.app.loader, 'assets/sounds/');
    this.lightRenderService = new LightRenderService(this.spriteManager);
    this.particleRenderService = new ParticleRenderService(this.spriteManager);
    this.renderService = new RenderService(this.spriteManager, this.lightRenderService, this.particleRenderService, this.inputManager, this.characterController, this.soundManager);
    this.eventHandler = new EventHandler(this.particleRenderService, this.soundManager);
  }

  public async init() {
    await this.spriteManager.init();
    await this.soundManager.init();
    this.inputManager.init();

    //this.soundManager.playMusic();

    for (const fontName of ['MatchupPro', 'ExpressionPro', 'EquipmentPro', 'FutilePro', 'CompassPro']) {
      var font = new FontFaceObserver(fontName);
      await font.load();
    }

    console.log("Everything initialized");

    // Display stuff
    const sceneContainer = this.renderService.init();
    this.app.stage.addChild(sceneContainer);

    this.socketClient.registerListener(SocketMessageReceived.UpdateBoardStateDynamic, (boardStateDynamic: BoardStateDynamic) => {
      this.board.update(boardStateDynamic);
      this.eventHandler.update(boardStateDynamic.events, this.board.player.entity.coord);

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

  public postMapInit(cells: Cell[][]) {
    this.renderService.postMapInit(cells);
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
        const speed = 0.08 * this.board.gameConfig.playerSpeed;
        var entityInRange = this.findEntityInRange(this.board.player, this.board.entities, this.board.players);
        let input = this.inputManager.get(this.board.player, entityInRange?.name, parseFloat((delta * speed).toFixed(3)));

        if (input.direction.x != 0 || input.direction.y != 0 || input.type == InputType.Attack || input.type == InputType.UseItem) {
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

        this.renderService.renderMap(this.board.cells, this.board.player, this.board.players, this.board.entities, this.board.entitiesPreviousCoords, entityInRange?.name, isHiding, interpolFactor);
        this.renderService.renderCharacter(this.board.player.entity, isHiding, input.direction);
        this.renderService.renderInventory(this.board.player.entity);
        this.renderService.renderPv(this.board.player.entity);
        this.renderService.renderGameState(this.board.player.role, this.board.nowTimestamp - this.board.startTimestamp, this.board.gameConfig.nbSecsPerCycle);
        this.renderService.renderEffects(this.board.player, this.board.nowTimestamp - this.board.startTimestamp, isHiding, this.board.gameConfig.nbSecsPerCycle * 1000, this.board.gameConfig.badGuyVision, delta);

        this.guiController.setShowNightOverlay(false);
        break;
      case GameStatus.Discuss:
        this.renderService.renderGameState(this.board.player.role, this.board.nowTimestamp - this.board.startTimestamp, this.board.gameConfig.nbSecsDiscuss);
        this.renderService.renderInventory(this.board.player.entity);
        this.guiController.setShowNightOverlay(true);
        break;
      case GameStatus.Pause:
        break;
    }
  }

  private findEntityInRange(currentPlayer: Player, entities: { [name: string]: Entity; }, players: { [name: string]: Player; }) {
    let coord = currentPlayer.entity.coord;
    let minDist: number | null = Number.MAX_SAFE_INTEGER;
    let closestEntity: Entity | null = null;

    for (let entity of Object.values(entities)) {
      const dist = CoordHelper.distance(coord, entity.coord);
      if (dist < minDist && dist < 2) {
        minDist = dist;
        closestEntity = entity;
      }
    }

    // Only Bad guys can attack players
    if (currentPlayer.role != Role.Bad)
      return closestEntity;

    for (let player of Object.values(players)) {
      if (player.entity.name == currentPlayer.entity.name)
        continue;
      const dist = CoordHelper.distance(coord, player.entity.coord);
      if (dist < minDist && dist < 1.3) {
        minDist = dist;
        closestEntity = player.entity;
      }
    }

    return closestEntity;
  }
}

export type GuiController = {
  setShowGameModal: React.Dispatch<React.SetStateAction<boolean>>,
  setShowNightOverlay: React.Dispatch<React.SetStateAction<boolean>>
}