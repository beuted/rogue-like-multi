import { GameServerClient } from "./GameServerClient";

export class ModalController {
  private createGameButton: Element;
  private joinGameButton: Element;

  private gameHash: string = null;
  private interval: NodeJS.Timeout;

  constructor(private readonly gameServerClient: GameServerClient) {

  }

  public init() {
    this.showLobbyModal(false);

    // Create game button
    this.createGameButton = document.getElementById('create-game-btn');

    this.createGameButton.addEventListener('click', async () => {
      let timePerCycle = (<HTMLInputElement>document.getElementById('time-per-cycle-input')).value;
      let timeToDiscuss = (<HTMLInputElement>document.getElementById('time-to-discuss-input')).value;
      if (timePerCycle && timeToDiscuss) {
        this.gameHash = await this.createGame(Number(timePerCycle), Number(timeToDiscuss));
        if (!this.gameHash) {
          alert('There is already a game running, one game at a time !');
          return;
        }
        this.showLobbyModal(true);
      }
    });

    // Join game button
    this.joinGameButton = document.getElementById('join-game-btn');

    this.joinGameButton.addEventListener('click', async () => {
      let gameHash = (<HTMLInputElement>document.getElementById('join-game-id-input')).value;
      if (gameHash) {
        this.gameHash = await this.joinGame(gameHash);
        this.showLobbyModal(true);
      }
    });

     // Start game button
     this.joinGameButton = document.getElementById('start-game-btn');

     this.joinGameButton.addEventListener('click', () => {
         this.startGame(this.gameHash);
     });

     // Show players in lobby
     this.interval = setInterval(async () => {
       if (!this.gameHash)
        return;
      var players = await this.gameServerClient.getPlayers(this.gameHash);
      var playerListElt = document.getElementById('player-list');
      playerListElt.innerHTML = '';
      for (const player of players) {
        let elt = document.createElement('div');
        elt.innerHTML = player;
        playerListElt.appendChild(elt);
      }
     }, 2000);

  }

  private async createGame(timePerCycle: number, timeToDiscuss: number): Promise<string> {
    return await this.gameServerClient.createGame(timePerCycle, timeToDiscuss);
  }

  private async joinGame(gameHash: string): Promise<string> {
    return await this.gameServerClient.joinGame(gameHash);
  }

  private async startGame(gameHash: string) {
    await this.gameServerClient.startGame(gameHash);
  }

  private showLobbyModal(show: boolean) {
    let selectGameModal = document.getElementById('select-game-modal');
    selectGameModal.style.display = !show ? "flex" : "none";

    let lobbyModal = document.getElementById('lobby-modal');
    lobbyModal.style.display = show ? "flex" : "none";
  }

  public showComponent(show: boolean) {
    let component = document.getElementById('init-game');
    component.style.display = show ? "flex" : "none";

    if (!show) {
      clearInterval(this.interval);
    }
  }
}