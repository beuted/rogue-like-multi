import { keyboard } from "./Keyboard";

export class InputManager {
  private vx: number = 0;
  private vy: number = 0;

  constructor() {

  }

  public get() {
    var res = {
      vx: this.vx,
      vy: this.vy
    }

    this.vx = 0;
    this.vy = 0;

    return res;
  }

  public init() {
    //Capture the keyboard arrow keys
    let left = keyboard("ArrowLeft"),
    up = keyboard("ArrowUp"),
    right = keyboard("ArrowRight"),
    down = keyboard("ArrowDown");

    //Left arrow key `press` method
    left.press = () => {
      //Change the player's velocity when the key is pressed
      this.vx = -1;
      this.vy = 0;
    };

    //Left arrow key `release` method
    left.release = () => {
      //If the left arrow has been released, and the right arrow isn't down,
      //and the player isn't moving vertically:
      //Stop the player
      if (!right.isDown && this.vy === 0) {
        this.vx = 0;
      }
    };

    //Up
    up.press = () => {
      this.vy = -1;
      this.vx = 0;
    };
    up.release = () => {
      if (!down.isDown && this.vx === 0) {
        this.vy = 0;
      }
    };

    //Right
    right.press = () => {
      this.vx = 1;
      this.vy = 0;
    };
    right.release = () => {
      if (!left.isDown && this.vy === 0) {
        this.vx = 0;
      }
    };

    //Down
    down.press = () => {
      this.vy = 1;
      this.vx = 0;
    };
    down.release = () => {
      if (!up.isDown && this.vx === 0) {
        this.vy = 0;
      }
    };
  }
}