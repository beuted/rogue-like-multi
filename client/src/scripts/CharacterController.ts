import { SocketClient, SocketMessageSent } from "./SocketClient";
import { Input } from "./InputManager";

export class CharacterController {
  constructor(private socketClient: SocketClient) {}

  public sendInput(input: Input) {
    this.socketClient.SendMessage(SocketMessageSent.SendInput, Date.now(), input);
  }

  public talk(message: string) {
    // Doesn't count like an action, might be a separate canal at some point
    this.socketClient.SendMessage(SocketMessageSent.Talk, 0, message);
  }
}