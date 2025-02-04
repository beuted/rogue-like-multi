import { Loader, LoaderResource } from "pixi.js";
import sound from "pixi-sound";

export enum Sound {
  Bush = "enter-bush",
  Parry = "hit-parry",
  Flash = "flash",
  Stab = "hit-stab",
  Heal = "heal",
}
export class SoundManager {
  public isMusicPlaying = false;

  private soundPath: string;
  musicSound: sound.Sound;

  constructor(private appLoader: Loader) {
    this.soundPath = "assets/sounds/";
  }

  init(): Promise<void> {
    return new Promise((resolve) => {
      this.appLoader
        .add("musical", this.soundPath + "GameDekajoo 5.wav")
        .add(Sound.Bush, this.soundPath + "enter-bush.wav")
        .add(Sound.Parry, this.soundPath + "hit-parry.wav")
        .add(Sound.Flash, this.soundPath + "flash.wav")
        .add(Sound.Stab, this.soundPath + "Knife-Stab-1.mp3")
        .add(Sound.Heal, this.soundPath + "drink.mp3");

      this.appLoader.onProgress.add(loadProgressHandler);

      this.appLoader.load(() => {
        resolve();
      });

      this.musicSound = sound.Sound.from(this.soundPath + "GameDekajoo 5.wav");
      this.musicSound.loop = true;
      this.musicSound.volume = 0;
      this.musicSound.play();
    });
  }

  playMusic() {
    this.isMusicPlaying = true;
    this.musicSound.volume = 0.2;
  }

  stopMusic() {
    this.isMusicPlaying = false;
    this.musicSound.volume = 0;
  }

  play(soundName: Sound, volume: number = 1) {
    sound.play(soundName, { loop: false, volume });
  }
}

function loadProgressHandler(loader: Loader, resource: LoaderResource) {
  console.log(`SoundManager: loading: ${resource.name} (${resource.url})`);
  console.log(`SoundManager: progress: ${loader.progress}%`);
}
