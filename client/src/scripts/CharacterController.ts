import { SocketClient, SocketMessageSent } from "./SocketClient";
import { Player } from "./Board";
import { RenderService } from "./RenderService";
import { Input } from "./InputManager";

export class CharacterController {
  constructor(private socketClient: SocketClient, private renderService: RenderService) {}

  public sendInput(input: Input) {
    this.socketClient.SendMessage(SocketMessageSent.SendInput, Date.now(), input);
  }

  public talk(player: Player, message: string) {
    // Doesn't count like an action, might be a separate canal at some point
    this.socketClient.SendMessage(SocketMessageSent.Talk, 0, message);
  }
}