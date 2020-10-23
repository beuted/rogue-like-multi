import * as signalR from "@microsoft/signalr";

export class SocketClient {
  private connection: signalR.HubConnection;

  constructor() {

  }

  public async init(user: {username: string, password: string}) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("/hub", {
        httpClient: new CustomHttpClient(signalR.NullLogger.instance, user),
        accessTokenFactory: () => btoa(`${user.username}:${user.password}`) })
      .build();

    await this.connection.start().catch(err => console.error(err)).then(() => {
      console.log('[SocketClient] Connection established');
    });
  }

  public SendMessage(messageName: SocketMessageSent, ...args : any[]) {
    this.connection.send(messageName, ...args)
  }

  public registerListener(messageName: SocketMessageReceived, cb: (...args: any[]) => void) {
    this.connection.on(messageName, cb);
  }
}

export enum SocketMessageSent {
  Move = "Move",
  Talk = "Talk",
  Attack = "Attack",
  SendInput = "SendInput"
}

export enum SocketMessageReceived {
  SetBoardStateDynamic = "setBoardStateDynamic",
  NewMessage = "newMessage"
}

class CustomHttpClient extends signalR.DefaultHttpClient {
  constructor(logger: signalR.ILogger, private user: {username: string, password: string}) {
    super(logger)
  }
  public send(request: signalR.HttpRequest): Promise<signalR.HttpResponse> {
    request.headers = {
      ...request.headers,
      'Authorization': `Basic ${btoa (`${this.user.username}:${this.user.password}`)}`
    };
    request.url = request.url + `&access_token=${btoa (`${this.user.username}:${this.user.password}`)}` //USELESS ??????
    return super.send(request);
  }
}