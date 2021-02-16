import { GameState, GameConfig, Player } from "./Board";

export class GameServerClient {
  public username: string;
  public static password = 'toto';

  public async authenticate(): Promise<{ username: string, password: string } | null> {
    this.username = localStorage.getItem('username');
    while (!this.username || this.username == '' || this.username == 'null') {
      this.username = prompt('Please enter your username');
      localStorage.setItem('username', this.username);
    }

    let user = await fetch('/api/users/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Username: this.username, Password: GameServerClient.password }),
    })
      .then(response => {
        if (response.status == 400) {
          alert(`Failed to authenticate with user ${this.username}, please refresh the page to try again`);
          localStorage.setItem('username', '');
          this.username = null;
          return null;
        } else if (!response.ok) {
          alert(`Server not responding, please try again later`);
          return null;
        }
        return { username: this.username, password: GameServerClient.password }
      })

    return user;
  }

  public async getState(gameHash: string): Promise<GameState | null> {
    return await fetch(`/api/game-state/${gameHash}`, {
      method: 'GET',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`
      }),
    })
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.text();
      }).then(text => {
        // If there is no game backend returns null, that get
        if (text)
          return JSON.parse(text);
        return null;
      })
  }

  public async createGame(gameConfig: GameConfig): Promise<string | null> {
    return await fetch('/api/game-state/create', {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`,
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(gameConfig),
    })
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.text();
      })
  }

  public async updateGameConfig(gameHash: string, gameConfig: GameConfig): Promise<string | null> {
    return await fetch(`/api/game-state/${gameHash}/config`, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`,
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(gameConfig),
    })
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.text();
      })
  }


  public async fetchGameConfig(gameHash: string): Promise<GameConfig | null> {
    return await fetch(`/api/game-state/${gameHash}/config`, {
      method: 'GET',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`,
        'Content-Type': 'application/json'
      }),
    })
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
  }

  public async joinGame(gameHash: string): Promise<string | null> {
    return await fetch(`/api/game-state/${gameHash}/join`, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`,
        'Content-Type': 'application/json'
      }),
    })
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.text();
      })
  }

  public async startGame(gameHash: string): Promise<any> {
    return await fetch(`/api/game-state/${gameHash}/start`, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`,
        'Content-Type': 'application/json'
      }),
    })
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.text();
      })
  }

  public async setPlayerSkinId(gameHash: string, userName: string, skinId: number): Promise<any> {
    return await fetch(`/api/game-state/${gameHash}/user/${userName}/skin/${skinId}`, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`,
        'Content-Type': 'application/json'
      }),
    })
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.text();
      })
  }

  public async getPlayers(gameHash: string): Promise<{ [name: string]: Player } | null> {
    return await fetch(`/api/game-state/${gameHash}/players`, {
      method: 'GET',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`,
        'Content-Type': 'application/json'
      }),
    })
      .then(response => {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
  }

  public async resetGame(): Promise<boolean> {
    return await fetch('/api/game-state/reset', {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${btoa(`${this.username}:${GameServerClient.password}`)}`
      }),
    })
      .then(response => {
        if (!response.ok) {
          return false;
        }
        return true;
      })
  }
}