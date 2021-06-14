import { ParticleRenderService } from "./ParticleRenderService";
import { ActionEvent, ActionEventType, Role } from "./Board";
import { SoundManager, Sound } from "./SoundManager";
import { Coord, CoordHelper } from "./Coord";

export class EventHandler {
  private handledEvents: string[] = [];
  private hasDeclaredVictory: boolean = false;
  constructor(private particleRenderService: ParticleRenderService, private soundManager: SoundManager) {
    let handledEventsJson = localStorage.getItem('handledEvents');
    if (handledEventsJson != null)
      this.handledEvents = JSON.parse(handledEventsJson);
    else
      localStorage.setItem('handledEvents', JSON.stringify(this.handledEvents));
  }

  update(events: ActionEvent[], playerCoord: Coord) {
    // TODO clean la liste de temps en temps
    for (const event of events) {
      if (!this.handledEvents.includes(event.guid)) {
        if ((event.coord.x != 0 || event.coord.y != 0) && CoordHelper.maxDistanceOnOneDimension(playerCoord, event.coord) > 10) {
          // We ignore events that have a position and this position is far from the player
          // Ideally this should be done by the server
          this.handledEvents.push(event.guid);
          localStorage.setItem('handledEvents', JSON.stringify(this.handledEvents));
          return;
        }

        switch (event.type) {
          case ActionEventType.Attack:
            this.particleRenderService.handleEvent(event);
            this.soundManager.play(Sound.Stab);
            break;
          case ActionEventType.ShieldBreak:
            this.soundManager.play(Sound.Parry);
            this.particleRenderService.handleEvent(event);
            break;
          case ActionEventType.Heal:
            this.soundManager.play(Sound.Heal, 0.7);
            this.particleRenderService.handleEvent(event);
            break;
          case ActionEventType.FlashIn:
            this.soundManager.play(Sound.Flash, 0.5);
            this.particleRenderService.handleEvent(event);
            break;
          case ActionEventType.FlashOut:
            this.particleRenderService.handleEvent(event);
            break;
          case ActionEventType.EndGame:
            if (!this.hasDeclaredVictory) // Just another hack to avoid showing this message a thousand times
              break;
            this.hasDeclaredVictory = true;
            window.alert(`${event.winnerTeam == Role.Good ? 'The wizards' : 'Mirkwood forest'} won the game !`);
            location.reload(); // This is needed atm to reset the state TODO: do a proper state reset !
            break;
          case ActionEventType.VoteResult:
            if (event.playerName != null)
              alert(`The player ${event.playerName} was burned like the traitor he was! (was he ?)`);
            else
              alert('No one had enough vote to be burned to death.');
            break;
        }
        this.handledEvents.push(event.guid);
        localStorage.setItem('handledEvents', JSON.stringify(this.handledEvents));
      }
    }
  }

  public reset() {
    this.handledEvents = [];
    localStorage.setItem('handledEvents', JSON.stringify(this.handledEvents));
  }
}