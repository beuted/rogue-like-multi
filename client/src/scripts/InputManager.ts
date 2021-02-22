import { keyboard } from "./Keyboard";
import { Coord } from "./Coord";
import { Player } from "./Board";
import { ItemType } from "./Cell";

export enum InputType {
  Move = 0,
  Attack = 1,
  Vote = 2,
  GiveFood = 3,
  GiveMaterial = 4,
  UseItem = 5
}

export interface Input {
  type: InputType,
  direction: Coord,
  pressTime: number,
  entityName: string | null,
  item: ItemType | null,
  inputSequenceNumber: number,
  time: number;
}

export class InputManager {
  private vx: number = 0;
  private vy: number = 0;
  private attack: boolean = false;
  private inputSequenceNumber: number = 0;
  private itemPress: number | null = null;

  constructor() {

  }

  public getGiveFood(): Input {
    return {
      type: InputType.GiveFood,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),

      item: null,
      direction: null,
      pressTime: null,
      entityName: null,
    }
  }

  public getGiveMaterial(): Input {
    return {
      type: InputType.GiveMaterial,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),

      item: null,
      direction: null,
      pressTime: null,
      entityName: null,
    }
  }

  public getUseItem(item: ItemType): Input {
    return {
      type: InputType.UseItem,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),
      item: item,

      direction: { x: 0, y: 0 },
      pressTime: null,
      entityName: null,
    }
  }

  public getVote(name: string): Input {
    return {
      type: InputType.Vote,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),
      entityName: name,

      item: null,
      direction: null,
      pressTime: null
    }
  }

  public get(player: Player, entityInRangeName: string, delta: number): Input {
    if (this.vx != 0 || this.vy != 0 || this.attack) {
      this.inputSequenceNumber++;
    }

    if (this.itemPress != null) {
      const item = player.entity.inventory[this.itemPress];
      this.itemPress = null;
      if (item != null && item != ItemType.Empty) {
        this.inputSequenceNumber++;
        return this.getUseItem(item);
      }
    }

    let canAttack = Date.now() > player.entity.coolDownAttack && player.entity.pv > 0;
    const attacking = canAttack ? this.attack : false;

    // Diagonal factor to avoid going faster on diagonal
    let diagonalFactor = this.vx != 0 && this.vy != 0 ? 1 / Math.SQRT2 : 1;
    var res: Input = {
      type: attacking ? InputType.Attack : InputType.Move,
      direction: {
        x: this.vx * diagonalFactor,
        y: this.vy * diagonalFactor
      },
      pressTime: delta,
      inputSequenceNumber: this.inputSequenceNumber,
      time: Date.now(),
      item: null,
      entityName: entityInRangeName
    }


    return res;
  }

  public init() {
    //Capture the keyboard arrow keys
    let left = keyboard("ArrowLeft"),
      a = keyboard("a"),
      q = keyboard("q"),
      up = keyboard("ArrowUp"),
      z = keyboard("z"),
      w = keyboard("w"),
      right = keyboard("ArrowRight"),
      d = keyboard("d"),
      down = keyboard("ArrowDown"),
      s = keyboard("s"),
      space = keyboard(" "),
      key1 = keyboard("1"),
      key1bis = keyboard("&"),
      key2 = keyboard("2"),
      key2bis = keyboard("é"),
      key3 = keyboard("3"),
      key3bis = keyboard("\""),
      key4 = keyboard("4"),
      key4bis = keyboard("'"),
      key5 = keyboard("5"),
      key5bis = keyboard("("),
      key6 = keyboard("6"),
      key6bis = keyboard("-"),
      key7 = keyboard("7"),
      key7bis = keyboard("è"),
      key8 = keyboard("8"),
      key8bis = keyboard("_"),
      key9 = keyboard("9"),
      key9bis = keyboard("ç"),
      key0 = keyboard("0"),
      key0bis = keyboard("à");


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
    a.press = left.press;
    q.press = left.press;

    //Left arrow key `release` method
    left.release = () => {
      //If the left arrow has been released, and the right arrow isn't down,
      //and the player isn't moving vertically:
      //Stop the player
      if (!right.isDown) {
        this.vx = 0;
      }
    };
    a.release = left.release;
    q.release = left.release;

    //Up
    up.press = () => {
      this.vy = -1;
    };
    z.press = up.press;
    w.press = up.press;
    up.release = () => {
      if (!down.isDown) {
        this.vy = 0;
      }
    };
    z.release = up.release;
    w.release = up.release;


    //Right
    right.press = () => {
      this.vx = 1;
    };
    d.press = right.press;
    right.release = () => {
      if (!left.isDown) {
        this.vx = 0;
      }
    };
    d.release = right.release;

    //Down
    down.press = () => {
      this.vy = 1;
    };
    s.press = down.press;
    down.release = () => {
      if (!up.isDown) {
        this.vy = 0;
      }
    };
    s.release = down.release;

    key1.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 0;
      }
    }
    key1bis.press = key1.press;

    key2.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 1;
      }
    };
    key2bis.press = key2.press;

    key3.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 2;
      }
    };
    key3bis.press = key3.press;

    key4.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 3;
      }
    };
    key4bis.press = key4.press;

    key5.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 4;
      }
    };
    key5bis.press = key5.press;

    key6.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 5;
      }
    };
    key6bis.press = key6.press;

    key7.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 6;
      }
    };
    key7bis.press = key7.press;

    key8.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 7;
      }
    };
    key8bis.press = key8.press;

    key9.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 8;
      }
    };
    key9bis.press = key9.press;

    key0.press = () => {
      if (this.itemPress == null) {
        this.itemPress = 9;
      }
    };
    key0bis.press = key0.press;
  }
}