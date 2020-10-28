import { Graphics, Container } from "pixi.js";
import { SpriteManager } from "./SpriteManager";
import { Entity } from "./Entity";
import { Coord } from "./Coord";

export class LightRenderService {

  private lightMask: Container;
  private playerLightOverlaySprite: Graphics = null;
  private staticLightsGraphics: {[id: string]: Graphics} = {};

  constructor(private spriteManager: SpriteManager) {

  }

  init(mapContainer: Container) {
    this.lightMask = new Container();
    this.playerLightOverlaySprite = new Graphics();

    // Player
    this.playerLightOverlaySprite = new Graphics();
      this.playerLightOverlaySprite.beginFill(0xFF3300);
      const RPlayer = 9*this.spriteManager.tilesetSize;
      this.playerLightOverlaySprite.drawCircle(
        0,
        0,
        RPlayer);

      this.playerLightOverlaySprite.endFill();

      // Fire
      this.addStaticLight('fire', {x: 5, y: 5}, 4);

      this.lightMask.addChild(this.playerLightOverlaySprite);

      mapContainer.mask = this.lightMask;
      mapContainer.addChild(this.lightMask);
  }

  addStaticLight(id: string, position: Coord, radius: number) {
    var light = new Graphics();
    const r = radius*this.spriteManager.tilesetSize;

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

  render(character: Entity) {
    // Move the light that follows the entities to their position
    this.playerLightOverlaySprite.x = ((character.coord.x + 0.5) * this.spriteManager.tilesetSize - 0.5);
    this.playerLightOverlaySprite.y = ((character.coord.y + 0.5) * this.spriteManager.tilesetSize - 0.5);

    // Make all lights flycker
    this.playerLightOverlaySprite.scale.set(0.5 + 0.02 * Math.sin(Date.now()/100)); // flyckering

    this.staticLightsGraphics['fire'].scale.set(0.5 + 0.02 * Math.sin(Date.now()/100)); // flyckering
  }
}
