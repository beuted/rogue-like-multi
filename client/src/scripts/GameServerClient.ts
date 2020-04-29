export class GameServerClient {
  public async getState(): Promise<any> {
    return await fetch('/api/game-state', {
      method: 'GET'
    })
    .then(response => response.json())
  }
}