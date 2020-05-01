export class GameServerClient {
  public username: string;
  public static password = 'toto';

  public async authenticate(): Promise<{username: string, password: string} | null> {
    this.username = localStorage.getItem('username');
    while (!this.username || this.username == '') {
      this.username = prompt('Please enter your username');
      console.log('nope')
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
      if (!response.ok) {
        alert(`Failed to authenticate with user ${this.username}, please refresh the page to try again`);
        localStorage.setItem('username', '');
        this.username = null;
        return null
      }
      return {username: this.username, password: GameServerClient.password }
    })

    return user;
  }

  public async getState(): Promise<any> {
    return await fetch('/api/game-state', {
      method: 'GET',
      headers: new Headers({
        'Authorization': `Basic ${btoa (`${this.username}:${GameServerClient.password}`)}`
      }),
    })
    .then(response => {
      if (!response.ok) {
        return {};
      }
      return response.json();
    })
  }
}