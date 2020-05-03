import { SocketClient, SocketMessageSent } from "./SocketClient";
import { Coord } from "./Coord";
import { Player } from "./Board";

export class CharacterController {
  constructor(private socketClient: SocketClient) {}

  public move(player: Player, newPlayerPosition: Coord) {
    //player.entity.coord = newPlayerPosition
    player.hasPlayedThisTurn = true;
    this.socketClient.SendMessage(SocketMessageSent.Move, newPlayerPosition);
  }

  public talk(player: Player, message: string) {
    player.hasPlayedThisTurn = true;
    this.socketClient.SendMessage(SocketMessageSent.Talk, message);
  }

}