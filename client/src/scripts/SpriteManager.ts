import { Texture, Rectangle, Loader, LoaderResource } from 'pixi.js';

export class SpriteManager {
  public textures: Texture[] = [];
  public animations: { [key: number]: Texture[] };
  public inventoryBgTexture: Texture;

  constructor(private appLoader: Loader, private tilesetPath: string, private menuPath: string, public tilesetSize: number, private tilesetHeight: number, private tilesetWidth: number) { }

  init() {
    return new Promise((resolve) => {
      this.appLoader
        .add('tilemap', this.tilesetPath)
        .add('menu', this.menuPath)
        .on('progress', loadProgressHandler)
        .load(() => {
          let baseTexture = this.appLoader.resources['tilemap'].texture.baseTexture

          for (let i = 0; i < this.tilesetHeight; i++) {
            for (let j = 0; j < this.tilesetWidth; j++) {
              let texture = new Texture(baseTexture);
              let rectangle = new Rectangle(this.tilesetSize * j, this.tilesetSize * i, this.tilesetSize, this.tilesetSize);
              texture.frame = rectangle;
              this.textures.push(texture);
            }
          }
          this.animations = {
            4: // char1
              [this.textures[220],
              this.textures[221],
              this.textures[222],
              this.textures[223],
              this.textures[224],
              this.textures[225],
              this.textures[226],
              this.textures[227]],
            5: // char2
              [this.textures[210],
              this.textures[211],
              this.textures[212],
              this.textures[213],
              this.textures[214],
              this.textures[215],
              this.textures[216],
              this.textures[217]],
            6: // char3
              [this.textures[110],
              this.textures[111],
              this.textures[112],
              this.textures[113],
              this.textures[114],
              this.textures[115],
              this.textures[116],
              this.textures[117]],
            7: // char4
              [this.textures[7]],
            14: // Snake
              [this.textures[235],
              this.textures[236],
              this.textures[237]],
            15: // dog
              [this.textures[230],
              this.textures[231],
              this.textures[232],
              ],
            16: //Rat
              [this.textures[240],
              this.textures[241],
              this.textures[242]],
            104: // char1 dash
              [this.textures[250],
              this.textures[250],
              this.textures[250],
              this.textures[251]],
            105: // char2 dash
              [this.textures[260],
              this.textures[260],
              this.textures[260],
              this.textures[261]],
            106: // char3 dash
              [this.textures[270],
              this.textures[270],
              this.textures[270],
              this.textures[271]],
          }

          let menuTexture = this.appLoader.resources['menu'].texture.baseTexture;
          let texture = new Texture(menuTexture);
          let rectangle = new Rectangle(0, 0, 118, 11);
          texture.frame = rectangle;
          this.inventoryBgTexture = texture;


          resolve();
        });
    });
  };
}

function loadProgressHandler(loader: Loader, resource: LoaderResource) {
  console.log(`SpriteManager: loading: ${resource.name} (${resource.url})`);
  console.log(`SpriteManager: progress: ${loader.progress}%`);
}
