import { Loader, LoaderResource } from 'pixi.js';
import sound from 'pixi-sound';

export enum Sound {
  Bush = 'enter-bush',
  Parry = 'hit-parry',
  Stab = 'hit-stab',
  Heal = 'heal',
}
export class SoundManager {
  constructor(private appLoader: Loader, private soundPath: string) { }

  init(): Promise<void> {
    return new Promise((resolve) => {
      this.appLoader
        .add('musical', this.soundPath + 'musical.mp3')
        .add(Sound.Bush, this.soundPath + 'enter-bush.wav')
        .add(Sound.Parry, this.soundPath + 'hit-parry.wav')
        .add(Sound.Stab, this.soundPath + 'Knife-Stab-1.mp3')
        .add(Sound.Heal, this.soundPath + 'drink.mp3')
        .on('progress', loadProgressHandler)
        .load(() => {
          resolve();
        });
    });
  }

  playMusic() {
    sound.play('musical', { loop: true });
  }

  play(soundName: Sound) {
    sound.play(soundName, { loop: false });
  }
}

function loadProgressHandler(loader: Loader, resource: LoaderResource) {
  console.log(`SoundManager: loading: ${resource.name} (${resource.url})`);
  console.log(`SoundManager: progress: ${loader.progress}%`);
}