import { ParticleRenderService } from "./ParticleRenderService";
import { ActionEvent, ActionEventType } from "./Board";

export class EventHandler {
  private handledEvents: number[] = [];
  constructor(private particleRenderService: ParticleRenderService) {
      let handledEventsJson = localStorage.getItem('handledEvents');
      if (handledEventsJson != null)
        this.handledEvents = JSON.parse(handledEventsJson);
      else
        localStorage.setItem('handledEvents', JSON.stringify(this.handledEvents));
  }

  public update(events: ActionEvent[]) {
    // TODO: clean de temps en temps cette list de handled events
    for (const event of events) {
      if (!this.handledEvents.includes(event.timestamp)) {
        if (event.type == ActionEventType.Attack)
          this.particleRenderService.handleEvent(event);
        if (event.type == ActionEventType.VoteResult) {
          if (event.playerName != null)
            alert(`The player ${event.playerName} was burned like the traitor he was! (was he ?)`);
          else
            alert('No one had enough vote to be burned to death.');
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