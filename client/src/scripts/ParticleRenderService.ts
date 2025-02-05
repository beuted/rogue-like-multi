import { Container, Sprite } from "pixi.js";
import { Coord } from "./Coord";
import * as particles from 'pixi-particles'
import { SpriteManager } from "./SpriteManager";
import { AttackEvent, ActionEventType, ShieldBreakEvent, HealEvent, FlashInEvent, FlashOutEvent } from "./Board";
import { Cell, FloorType } from "./Cell";

export class ParticleRenderService {
  private particleContainer: Container;
  private staticParticleEmitters: particles.Emitter[] = [];
  private effectSprites: Sprite[] = [];

  constructor(private spriteManager: SpriteManager) {

  }

  init(mapContainer: Container, cells: Cell[][]) {
    this.particleContainer = new Container();
    this.particleContainer.zIndex = 1000;
    mapContainer.addChild(this.particleContainer);

    // Add fire smokes
    for (let i = 0; i < cells.length; i++) {
      for (let j = 0; j < cells[0].length; j++) {
        if (cells[i][j].floorType == FloorType.CampFire) {
          this.addSmokeStaticEmitter({ x: i, y: j });
        }
      }
    }

  }

  handleEvent(event: AttackEvent | ShieldBreakEvent | HealEvent | FlashInEvent | FlashOutEvent) {
    switch (event.type) {
      case ActionEventType.Attack: this.addBloodStaticEmitter(event.coord); break;
      case ActionEventType.ShieldBreak: this.addSparkleStaticEmitter(event.coord); break;
      case ActionEventType.Heal: this.addHealStaticEmitter(event.coord); break;
      case ActionEventType.FlashIn: this.addFlashInStaticEmitter(event.coord); break;
      case ActionEventType.FlashOut: this.addFlashOutStaticEmitter(event.coord); break;
    }
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
          "start": 0.8,
          "end": 0.8,
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
        "noRotation": true,
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
          "start": "#2e2e2e",
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
        "noRotation": true,
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

  addHealStaticEmitter(position: Coord) {
    //TODO: clean dictionnary sometimes
    var emitter = new particles.Emitter(
      this.particleContainer,
      ["assets/cross.png"],
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
        "color": {
          "start": "#34a853",
          "end": "#34a853"
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
        "frequency": 0.07,
        "emitterLifetime": 0.5,
        "maxParticles": 1000,
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

  addFlashInStaticEmitter(position: Coord) {
    this.addFlashOutStaticEmitter(position);
  }

  addFlashOutStaticEmitter(position: Coord) {
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
          "end": 0.2,
          "minimumScaleMultiplier": 1
        },
        "color": {
          "start": "#ffffff",
          "end": "#2196F3"
        },
        "speed": {
          "start": 10,
          "end": 0,
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
          "min": 0.1,
          "max": 0.6
        },
        "blendMode": "normal",
        "frequency": 0.03,
        "emitterLifetime": 0.3,
        "maxParticles": 1000,
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

  addSparkleStaticEmitter(position: Coord) {
    // TODO: clean dictionnary sometimes
    var sprite = new Sprite(this.spriteManager.textures[104]);
    this.particleContainer.addChild(sprite);
    sprite.x = ((position.x) * this.spriteManager.tilesetSize);
    sprite.y = ((position.y - 1) * this.spriteManager.tilesetSize);
    this.effectSprites.push(sprite);

    var emitter = new particles.Emitter(
      this.particleContainer,
      ["assets/pixel.png"],
      {
        "alpha": {
          "start": 1.5,
          "end": 0.25
        },
        "scale": {
          "start": 1.25,
          "end": 0.5,
          "minimumScaleMultiplier": 1
        },
        "color": {
          "start": "#fffcd6",
          "end": "#ff0000"
        },
        "speed": {
          "start": 300,
          "end": 2,
          "minimumSpeedMultiplier": 1
        },
        "acceleration": {
          "x": 0,
          "y": 0
        },
        "maxSpeed": 1000,
        "startRotation": {
          "min": 0,
          "max": 360
        },
        "noRotation": true,
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
        "maxParticles": 15,
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

    let indexesToRemove = [];
    for (let i = 0; i <= this.effectSprites.length - 1; i++) {
      this.effectSprites[i].alpha = this.effectSprites[i].alpha - 0.01 * delta;
      if (this.effectSprites[i].alpha <= 0) {
        indexesToRemove.push(i);
      }
    }

    for (let i = indexesToRemove.length - 1; i >= 0; i--) {
      this.effectSprites.splice(indexesToRemove[i]);
    }
  }
}
