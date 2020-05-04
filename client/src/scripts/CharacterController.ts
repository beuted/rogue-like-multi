import { SocketClient, SocketMessageSent } from "./SocketClient";
import { Coord } from "./Coord";
import { Player } from "./Board";
import { RenderService } from "./RenderService";

export class CharacterController {
  constructor(private socketClient: SocketClient, private renderService: RenderService) {}

  public move(player: Player, newPlayerPosition: Coord) {
    //player.entity.coord = newPlayerPosition
    console.log("move ", player.hasPlayedThisTurn);
    player.hasPlayedThisTurn = true;
    this.socketClient.SendMessage(SocketMessageSent.Move, newPlayerPosition);
  }

  public talk(player: Player, message: string) {
    player.hasPlayedThisTurn = true;

    this.socketClient.SendMessage(SocketMessageSent.Talk, message);

    const playerCoord = player.entity.coord;
    for (var i = -8; i <=8; i++) {
      for (var j = -8; j <=8; j++) {
        this.renderService.addEffect({x: playerCoord.x+i, y: playerCoord.y+j}, 0x5dde87);
      }
    }
  }

  public attack(player: Player) {
    player.hasPlayedThisTurn = true;

    this.socketClient.SendMessage(SocketMessageSent.Attack);

    const playerCoord = player.entity.coord;
    for (var i = -1; i <=1; i++) {
      for (var j = -1; j <=1; j++) {
        this.renderService.addEffect({x: playerCoord.x+i, y: playerCoord.y+j}, 0xeb564b);
      }
    }
  }

}