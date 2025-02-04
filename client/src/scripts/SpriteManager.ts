import { Texture, Rectangle, Loader, LoaderResource } from "pixi.js";

export class SpriteManager {
  public textures: Texture[] = [];
  public animations: { [key: number]: Texture[] };
  public inventoryBgTexture: Texture;

  constructor(
    private appLoader: Loader,
    private tilesetPath: string,
    private menuPath: string,
    public tilesetSize: number,
    private tilesetHeight: number,
    private tilesetWidth: number
  ) {}

  init() {
    return new Promise<void>((resolve) => {
      this.appLoader
        .add("tilemap", this.tilesetPath)
        .add("menu", this.menuPath)
        .onProgress.add(loadProgressHandler)
        .load(() => {
          let baseTexture =
            this.appLoader.resources["tilemap"].texture.baseTexture;

          for (let i = 0; i < this.tilesetHeight; i++) {
            for (let j = 0; j < this.tilesetWidth; j++) {
              let texture = new Texture(baseTexture);
              let rectangle = new Rectangle(
                this.tilesetSize * j,
                this.tilesetSize * i,
                this.tilesetSize,
                this.tilesetSize
              );
              texture.frame = rectangle;
              this.textures.push(texture);
            }
          }
          this.animations = {
            // char1
            4: [
              this.textures[220],
              this.textures[221],
              this.textures[222],
              this.textures[223],
              this.textures[224],
              this.textures[225],
              this.textures[226],
              this.textures[227],
            ],
            // char2
            5: [
              this.textures[210],
              this.textures[211],
              this.textures[212],
              this.textures[213],
              this.textures[214],
              this.textures[215],
              this.textures[216],
              this.textures[217],
            ],
            // char3
            6: [
              this.textures[110],
              this.textures[111],
              this.textures[112],
              this.textures[113],
              this.textures[114],
              this.textures[115],
              this.textures[116],
              this.textures[117],
            ],
            // char4
            7: [
              this.textures[280],
              this.textures[281],
              this.textures[282],
              this.textures[283],
              this.textures[284],
              this.textures[285],
              this.textures[286],
              this.textures[287],
            ],
            // char5
            8: [
              this.textures[290],
              this.textures[291],
              this.textures[292],
              this.textures[293],
              this.textures[294],
              this.textures[295],
              this.textures[296],
              this.textures[297],
            ],
            // Snake
            14: [this.textures[235], this.textures[236], this.textures[237]],
            // dog
            15: [this.textures[230], this.textures[231], this.textures[232]],
            //Rat
            16: [this.textures[240], this.textures[241], this.textures[242]],
            // char1 dash
            104: [
              this.textures[250],
              this.textures[250],
              this.textures[250],
              this.textures[251],
            ],
            // char2 dash
            105: [
              this.textures[260],
              this.textures[260],
              this.textures[260],
              this.textures[261],
            ],
            // char3 dash
            106: [
              this.textures[270],
              this.textures[270],
              this.textures[270],
              this.textures[271],
            ],
            // char4 dash
            107: [
              this.textures[252],
              this.textures[252],
              this.textures[252],
              this.textures[253],
            ],
            // char5 dash
            108: [
              this.textures[254],
              this.textures[254],
              this.textures[254],
              this.textures[255],
            ],
          };

          let menuTexture =
            this.appLoader.resources["menu"].texture.baseTexture;
          let texture = new Texture(menuTexture);
          let rectangle = new Rectangle(0, 0, 118, 11);
          texture.frame = rectangle;
          this.inventoryBgTexture = texture;

          resolve();
        });
    });
  }
}

function loadProgressHandler(loader: Loader, resource: LoaderResource) {
  console.log(`SpriteManager: loading: ${resource.name} (${resource.url})`);
  console.log(`SpriteManager: progress: ${loader.progress}%`);
}
