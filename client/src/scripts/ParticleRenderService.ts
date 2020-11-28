import { Container } from "pixi.js";
import { Coord } from "./Coord";
import * as particles from 'pixi-particles'
import { SpriteManager } from "./SpriteManager";
import { AttackEvent } from "./Board";

export class ParticleRenderService {
  private particleContainer: Container;
  private staticParticleEmitters: particles.Emitter[] = [];

  constructor(private spriteManager: SpriteManager) {

  }

  init(mapContainer: Container) {
    this.particleContainer = new Container();
    this.particleContainer.zIndex = 1000;
    this.addStaticEmitter({ x: 5, y: 5 }, 1);
    mapContainer.addChild(this.particleContainer);
  }

  handleEvent(event: AttackEvent) {
    this.addStaticEmitter(event.coord, 1)
  }

  addStaticEmitter(position: Coord, durationSec: number) {
    //TODO: clean dictionnary sometimes
    var emitter = new particles.Emitter(
      this.particleContainer,
      ["assets/particle.png"],
      {
        "alpha": {
          "start": 1,
          "end": 0
        },
        "scale": {
          "start": 0.1,
          "end": 0.01,
          "minimumScaleMultiplier": 1
        },
        "color": {
          "start": "#ba0000",
          "end": "#ff3d3d"
        },
        "speed": {
          "start": 50,
          "end": 20,
          "minimumSpeedMultiplier": 1
        },
        "acceleration": {
          "x": 0,
          "y": 0
        },
        "maxSpeed": 0,
        "startRotation": {
          "min": 0,
          "max": 360
        },
        "noRotation": false,
        "rotationSpeed": {
          "min": 0,
          "max": 0
        },
        "lifetime": {
          "min": 0.2,
          "max": 0.8
        },
        "blendMode": "normal",
        "frequency": 0.001,
        "emitterLifetime": durationSec,
        "maxParticles": 100,
        "pos": {
          "x": ((position.x + 0.5) * this.spriteManager.tilesetSize - 0.5),
          "y": ((position.y + 0.5) * this.spriteManager.tilesetSize - 0.5)
        },
        "addAtBack": false,
        "spawnType": "circle",
        "spawnCircle": {
          "x": 0,
          "y": 0,
          "r": 0
        }
      }
    )

    this.staticParticleEmitters.push(emitter);
    emitter.emit = true;
  }

  render(timestampDiff: number) {
    for (const staticParticleEmitter of this.staticParticleEmitters) {
      staticParticleEmitter.update(timestampDiff * 0.001);
    }
  }
}
