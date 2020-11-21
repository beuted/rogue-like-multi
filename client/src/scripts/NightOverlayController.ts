import { NightState } from "./Board";
import { InputManager } from "./InputManager";
import { Entity } from "./Entity";
import { CharacterController } from "./CharacterController";

interface PlayerDisplay {
  name: string;
  alive: boolean;
  playerVote: boolean;
  hasVoted: boolean;
}

export class NightOverlayController {
  private hash: string = null;
  constructor(private inputManager: InputManager, private characterController: CharacterController) {

  }

  public init() {
  }

  public render(playerName: string, nightState: NightState, players: Entity[]) {
    var newHash = JSON.stringify({ playerName, nightState, players })
    if (newHash == this.hash)
      return;

    this.hash = newHash;

    const playerDisplays: PlayerDisplay[] = [];
    let playerVote = nightState.votes.find(x => x.from == playerName)?.for;

    for (const player of players) {
      const hasVoted = nightState.votes.findIndex(x => x.from == player.name) != -1;

      playerDisplays.push({
        name: player.name,
        alive: player.pv > 0,
        playerVote: playerVote == player.name,
        hasVoted: hasVoted
      });
    }

    this.renderInternal(playerDisplays);
  }

  public show(show: boolean) {
    let nightOverlay = document.getElementById('night-overlay');
    nightOverlay.style.display = show ? "flex" : "none";
  }

  private renderInternal(playerDisplays: PlayerDisplay[]) {
    var playerListElt = document.getElementById('players-alive');
    playerListElt.innerHTML = '';
    for (const p of playerDisplays) {
      let elt = document.createElement('div');
      elt.innerHTML = `${p.name} ${p.alive ? '😎' : '💀'} ${p.hasVoted ? '✔' : ''}`;
      elt.style.fontWeight = p.playerVote ? 'bold' : 'normal';
      let btn = document.createElement('button');
      btn.innerHTML = `vote`;
      btn.disabled = !p.alive;
      btn.onclick = () => this.vote(p.name);
      elt.appendChild(btn);
      playerListElt.appendChild(elt);
    }
    let elt = document.createElement('div');
    elt.innerHTML = 'Pass ';
    let btn = document.createElement('button');
    btn.innerHTML = `vote`;
    btn.onclick = () => this.vote('pass');
    elt.appendChild(btn);
    playerListElt.appendChild(elt);
  }

  private vote(name: string) {
    console.log("voted for " + name);
    let inputVote = this.inputManager.getVote(name);
    this.characterController.sendInput(inputVote);
    return false;
  }
}