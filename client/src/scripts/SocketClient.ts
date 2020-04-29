import * as signalR from "@microsoft/signalr";

export class SocketClient {
  private connection: signalR.HubConnection;

  constructor() {

  }

  public async init() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("/hub")
      .build();

    await this.connection.start().catch(err => console.error(err)).then(() => {
      console.log('[SocketClient] Connection established');
    });
  }

  public SendMessage(messageName: SocketMessageSent, username: string, ...args : any[]) {
    this.connection.send(messageName, username, ...args)
      .then(() => console.log(`Msg ${messageName} sent (${username}): ${args.join(", ")}`));
  }

  public registerListener(messageName: SocketMessageReceived, cb: (...args: any[]) => void) {
    this.connection.on(messageName, cb);
  }
}

export enum SocketMessageSent {
  Move = "Move",
}

export enum SocketMessageReceived {
  SetMapStateDynamic = "setMapStateDynamic",
}