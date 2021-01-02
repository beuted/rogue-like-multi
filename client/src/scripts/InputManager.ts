import { keyboard } from "./Keyboard";
import { Coord } from "./Coord";
import { Role } from "./Board";

export enum InputType {
  Move = 0,
  Attack = 1,
  Vote = 2,
  GiveFood = 3,
  GiveMaterial = 4
}

export interface Input {
  type: InputType,
  direction: Coord,
  pressTime: number,
  vote: string | null,
  inputSequenceNumber: number,
  time: number;
}

export class InputManager {
  private vx: number = 0;
  private vy: number = 0;
  private attack: boolean = false;
  private inputSequenceNumber: number = 0;

  constructor() {

  }

  public getGiveFood(): Input {
    return {
      type: InputType.GiveFood,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),

      direction: null,
      pressTime: null,
      vote: null,
    }
  }

  public getGiveMaterial(): Input {
    return {
      type: InputType.GiveMaterial,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),

      direction: null,
      pressTime: null,
      vote: null,
    }
  }

  public getVote(name: string): Input {
    return {
      type: InputType.Vote,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),
      vote: name,

      direction: null,
      pressTime: null
    }
  }

  public get(coolDownAttack: number, role: Role, pv: number, delta: number): Input {
    if (this.vx != 0 || this.vy != 0 || this.attack) {
      this.inputSequenceNumber++;
    }

    let canAttack = role == Role.Bad && Date.now() > coolDownAttack && pv > 0;
    const attacking = canAttack ? this.attack : false;

    var res: Input = {
      type: attacking ? InputType.Attack : InputType.Move,
      direction: {
        x: this.vx,
        y: this.vy
      },
      pressTime: delta,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),
      vote: null
    }

    if (attacking)
      console.log("attack");

    return res;
  }

  public init() {
    //Capture the keyboard arrow keys
    let left = keyboard("ArrowLeft"),
      up = keyboard("ArrowUp"),
      right = keyboard("ArrowRight"),
      down = keyboard("ArrowDown"),
      space = keyboard(" ");


    space.press = () => {
      this.attack = true;
    }
    space.release = () => {
      this.attack = false;
    }

    //Left arrow key `press` method
    left.press = () => {
      //Change the player's velocity when the key is pressed
      this.vx = -1;
    };

    //Left arrow key `release` method
    left.release = () => {
      //If the left arrow has been released, and the right arrow isn't down,
      //and the player isn't moving vertically:
      //Stop the player
      if (!right.isDown) {
        this.vx = 0;
      }
    };

    //Up
    up.press = () => {
      this.vy = -1;
    };
    up.release = () => {
      if (!down.isDown) {
        this.vy = 0;
      }
    };

    //Right
    right.press = () => {
      this.vx = 1;
    };
    right.release = () => {
      if (!left.isDown) {
        this.vx = 0;
      }
    };

    //Down
    down.press = () => {
      this.vy = 1;
    };
    down.release = () => {
      if (!up.isDown) {
        this.vy = 0;
      }
    };
  }
}