import { Texture, Rectangle, Loader, LoaderResource } from 'pixi.js';

export class SpriteManager {
  public textures: Texture[] = [];

  constructor(private appLoader: Loader, private tilesetPath: string, public tilesetSize: number, private tilesetHeight: number, private tilesetWidth: number){}

  init() {
    return new Promise((resolve) => {
      this.appLoader
        .add('tilemap', this.tilesetPath)
        .on('progress', loadProgressHandler)
        .load(() => {
          let baseTexture = this.appLoader.resources['tilemap'].texture.baseTexture

          for (let i = 0; i < this.tilesetHeight; i++) {
            for (let j = 0; j < this.tilesetWidth; j++) {
              let texture = new Texture(baseTexture);
              let rectangle = new Rectangle(this.tilesetSize*j, this.tilesetSize*i, this.tilesetSize-1, this.tilesetSize-1);
              texture.frame = rectangle;
              this.textures.push(texture);
            }
          }
          resolve();
        });
      });
    };
}

function loadProgressHandler(loader: Loader, resource: LoaderResource) {
  console.log(`SpriteManager: loading: ${resource.name} (${resource.url})`);
  console.log(`SpriteManager: progress: ${loader.progress}%`);
}
