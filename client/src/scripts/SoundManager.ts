import { Loader, LoaderResource } from 'pixi.js';
import sound from 'pixi-sound';

export class SoundManager {
  constructor(private appLoader: Loader, private soundPath: string){}

  init(): Promise<void> {
    return new Promise((resolve) => {
      this.appLoader
      .add('musical', this.soundPath)
      .on('progress', loadProgressHandler)
      .load(() => {
        resolve();
      });
    });
  }

  play() {
    sound.play('musical', { loop: true });
  }
}

function loadProgressHandler(loader: Loader, resource: LoaderResource) {
  console.log(`SoundManager: loading: ${resource.name} (${resource.url})`);
  console.log(`SoundManager: progress: ${loader.progress}%`);
}