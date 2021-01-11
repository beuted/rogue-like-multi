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
    mapContainer.addChild(this.particleContainer);

    this.addSmokeStaticEmitter({ x: 50, y: 50 })
  }

  handleEvent(event: AttackEvent) {
    this.addBloodStaticEmitter(event.coord);
  }

  addLeafStaticEmitter(position: Coord) {
    //TODO: clean dictionnary sometimes
    var emitter = new particles.Emitter(
      this.particleContainer,
      ["assets/leaf.png"],
      {
        "alpha": {
          "start": 1,
          "end": 0
        },
        "scale": {
          "start": 1,
          "end": 1,
          "minimumScaleMultiplier": 1
        },
        "speed": {
          "start": 30,
          "end": 8,
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
          "min": -500,
          "max": 500
        },
        "lifetime": {
          "min": 0.1,
          "max": 0.6
        },
        "blendMode": "normal",
        "frequency": 0.0001,
        "emitterLifetime": 0.1,
        "maxParticles": 10,
        "pos": {
          "x": ((position.x + 0.5) * this.spriteManager.tilesetSize - 0.5),
          "y": ((position.y + 0.5) * this.spriteManager.tilesetSize - 0.5)
        },
        "addAtBack": false,
        "spawnType": "circle",
        "spawnCircle": {
          "x": 0,
          "y": 0,
          "r": 4
        }
      }
    )

    this.staticParticleEmitters.push(emitter);
    emitter.emit = true;
  }

  addSmokeStaticEmitter(position: Coord) {
    //TODO: clean dictionnary sometimes
    var emitter = new particles.Emitter(
      this.particleContainer,
      ["assets/pixel.png"],
      {
        "alpha": {
          "start": 1,
          "end": 0
        },
        "scale": {
          "start": 1,
          "end": 2,
          "minimumScaleMultiplier": 1
        },
        "color": {
          "start": "#000000",
          "end": "#ffffff"
        },
        "speed": {
          "start": 30,
          "end": 30,
          "minimumSpeedMultiplier": 1
        },
        "acceleration": {
          "x": 0,
          "y": 0
        },
        "maxSpeed": 0,
        "startRotation": {
          "min": 270,
          "max": 270
        },
        "noRotation": false,
        "rotationSpeed": {
          "min": 0,
          "max": 0
        },
        "lifetime": {
          "min": 0.1,
          "max": 0.6
        },
        "blendMode": "normal",
        "frequency": 0.0001,
        "emitterLifetime": -1,
        "maxParticles": 20,
        "pos": {
          "x": ((position.x + 0.5) * this.spriteManager.tilesetSize - 0.5),
          "y": ((position.y + 0.5) * this.spriteManager.tilesetSize - 0.5)
        },
        "addAtBack": false,
        "spawnType": "circle",
        "spawnCircle": {
          "x": 0,
          "y": -1,
          "r": 4
        }
      }
    )

    this.staticParticleEmitters.push(emitter);
    emitter.emit = true;
  }

  addBloodStaticEmitter(position: Coord) {
    //TODO: clean dictionnary sometimes
    var emitter = new particles.Emitter(
      this.particleContainer,
      ["assets/pixel.png"],
      {
        "alpha": {
          "start": 1,
          "end": 0
        },
        "scale": {
          "start": 3,
          "end": 1,
          "minimumScaleMultiplier": 1
        },
        "color": {
          "start": "#ba0000",
          "end": "#ff3d3d"
        },
        "speed": {
          "start": 150,
          "end": 60,
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
          "min": 0.05,
          "max": 0.2
        },
        "blendMode": "normal",
        "frequency": 0.001,
        "emitterLifetime": 0.1,
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
          "r": 2
        }
      }
    )

    this.staticParticleEmitters.push(emitter);
    emitter.emit = true;
  }

  render(delta: number) {
    for (const staticParticleEmitter of this.staticParticleEmitters) {
      staticParticleEmitter.update(delta * 0.01);
    }
  }
}
