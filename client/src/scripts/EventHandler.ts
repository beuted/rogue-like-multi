import { ParticleRenderService } from "./ParticleRenderService";
import { ActionEvent, ActionEventType } from "./Board";

export class EventHandler {
    private handledEvents: number[] = [];
    constructor(private particleRenderService: ParticleRenderService) {

    }

    update(events: ActionEvent[]) {
        // TODO clean la liste de temps en temps
        //TODO: store that in localStorage sinon des que tu reco tu relances les events
        for (const event of events) {
            if (!this.handledEvents.includes(event.timestamp)) {
                if (event.type == ActionEventType.Attack)
                    this.particleRenderService.handleEvent(event);
                if (event.type == ActionEventType.VoteResult) {
                    if (event.playerName != null)
                        alert(`The player ${event.playerName} was burned like the traitor he was! (was he ?)`);
                    else
                        alert('No one had enough vote to be burned to death.')
                }
                this.handledEvents.push(event.timestamp);
            }
        }
    }
}