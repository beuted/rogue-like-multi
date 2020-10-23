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

    const playerCoord = player.entity.coord;
    for (var i = -8; i <=8; i++) {
      for (var j = -8; j <=8; j++) {
        this.renderService.addEffect({x: playerCoord.x+i, y: playerCoord.y+j}, 0x5dde87);
      }
    }
  }

  public attack(player: Player) {
    this.socketClient.SendMessage(SocketMessageSent.Attack, Date.now());

    const playerCoord = player.entity.coord;
    for (var i = -1; i <=1; i++) {
      for (var j = -1; j <=1; j++) {
        this.renderService.addEffect({x: playerCoord.x+i, y: playerCoord.y+j}, 0xeb564b);
      }
    }
  }

}