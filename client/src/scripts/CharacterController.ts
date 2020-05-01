import { SocketClient, SocketMessageSent } from "./SocketClient";
import { Coord } from "./Coord";
import { Player } from "./Board";

export class CharacterController {
  constructor(private socketClient: SocketClient) {}

  public move(player: Player, vector: Coord) {
    player.hasPlayedThisTurn = true;
    player.entity.coord.x += vector.x;
    player.entity.coord.y += vector.y;
    this.socketClient.SendMessage(SocketMessageSent.Move, player.entity.coord);
  }

  public talk(player: Player, message: string) {
    player.hasPlayedThisTurn = true;
    this.socketClient.SendMessage(SocketMessageSent.Talk, message);
  }

}