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
                this.handledEvents.push(event.timestamp);
            }
        }
    }
}