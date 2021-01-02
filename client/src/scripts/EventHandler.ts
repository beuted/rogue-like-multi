import { ParticleRenderService } from "./ParticleRenderService";
import { ActionEvent, ActionEventType, Role } from "./Board";

export class EventHandler {
  private handledEvents: number[] = [];
  constructor(private particleRenderService: ParticleRenderService) {
    let handledEventsJson = localStorage.getItem('handledEvents');
    if (handledEventsJson != null)
      this.handledEvents = JSON.parse(handledEventsJson);
    else
      localStorage.setItem('handledEvents', JSON.stringify(this.handledEvents));
  }

  update(events: ActionEvent[]) {
    // TODO clean la liste de temps en temps
    for (const event of events) {
      if (!this.handledEvents.includes(event.timestamp)) {
        switch (event.type) {
          case ActionEventType.Attack:
            this.particleRenderService.handleEvent(event);
            break;
          case ActionEventType.EndGame:
            window.alert(`${event.winnerTeam == Role.Good ? 'The goods' : 'The bads'} won the game !`);
            location.reload();
            break;
          case ActionEventType.VoteResult:
            if (event.playerName != null)
              alert(`The player ${event.playerName} was burned like the traitor he was! (was he ?)`);
            else
              alert('No one had enough vote to be burned to death.');
            break;
        }
        this.handledEvents.push(event.timestamp);
        localStorage.setItem('handledEvents', JSON.stringify(this.handledEvents));
      }
    }
  }

  public reset() {
    this.handledEvents = [];
    localStorage.setItem('handledEvents', JSON.stringify(this.handledEvents));
  }
}