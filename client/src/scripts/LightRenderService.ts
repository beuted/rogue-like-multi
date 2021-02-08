import { Graphics, Container } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { Coord } from "./Coord";
import { Cell, FloorType } from "./Cell";
import { Player, Role } from "./Board";

export class LightRenderService {

  private lightMask: Container;
  private playerLightOverlaySprite: Graphics = null;
  private staticLightsGraphics: { [id: string]: Graphics } = {};

  constructor(private spriteManager: SpriteManager) {

  }

  init(mapContainer: Container, cells: Cell[][]) {
    this.lightMask = new Container();
    this.playerLightOverlaySprite = new Graphics();

    // Player
    this.playerLightOverlaySprite = new Graphics();
    this.playerLightOverlaySprite.beginFill(0xFF3300);
    const RPlayer = 9 * this.spriteManager.tilesetSize;
    this.playerLightOverlaySprite.drawCircle(
      0,
      0,
      RPlayer);

    this.playerLightOverlaySprite.endFill();

    // Fire
    for (let i = 0; i < cells.length; i++) {
      for (let j = 0; j < cells[0].length; j++) {
        if (cells[i][j].floorType == FloorType.CampFire) {
          this.addStaticLight(`fire-${i}-${j}`, { x: i, y: j }, 5);
        }

        if (cells[i][j].floorType == FloorType.StreetLamp) {
          this.addStaticLight(`fire-${i}-${j}`, { x: i, y: j }, 3);
        }
      }
    }

    this.lightMask.addChild(this.playerLightOverlaySprite);

    mapContainer.mask = this.lightMask;
    mapContainer.addChild(this.lightMask);
  }

  addStaticLight(id: string, position: Coord, radius: number) {
    var light = new Graphics();
    const r = radius * this.spriteManager.tilesetSize;

    light.beginFill(0xFF3300);
    light.drawCircle(
      0,
      0,
      r);
    light.endFill();

    light.x = ((position.x + 0.5) * this.spriteManager.tilesetSize - 0.5);
    light.y = ((position.y + 0.5) * this.spriteManager.tilesetSize - 0.5);

    this.lightMask.addChild(light)

    this.staticLightsGraphics[id] = light;
  }

  render(character: Player, timestampDiff: number, isHiding: boolean, nbMsPerCycle: number, badGuyVision: number) {
    // Move the light that follows the entities to their position
    this.playerLightOverlaySprite.x = ((character.entity.coord.x + 0.5) * this.spriteManager.tilesetSize - 0.5);
    this.playerLightOverlaySprite.y = ((character.entity.coord.y + 0.5) * this.spriteManager.tilesetSize - 0.5);

    // Make all lights flycker

    let circleSize;
    if (character.entity.pv <= 0) {
      circleSize = 1
    } else {
      var daylightFactor = Math.sin(timestampDiff * 2 * Math.PI / nbMsPerCycle - Math.PI / 2) + 1; // Day cycle
      if (isHiding)
        daylightFactor = Math.min(0.2, daylightFactor);
      circleSize = 0.1 + 0.5 * daylightFactor;

      if (character.role == Role.Bad) {
        circleSize = Math.max(circleSize, badGuyVision);
      }
    }

    circleSize += 0.005 * Math.sin(Date.now() / 100); // flyckering
    this.playerLightOverlaySprite.scale.set(circleSize);

    for (var key of Object.keys(this.staticLightsGraphics))
      this.staticLightsGraphics[key].scale.set(0.5 + 0.01 * Math.sin(Date.now() / 100)); // flyckering
  }
}
