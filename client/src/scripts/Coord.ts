export interface Coord {
  x: number,
  y: number
}

export interface FloatingCoord {
  x: number,
  y: number
}

export class CoordHelper {
  public static getClosestCoord(fCoord: FloatingCoord): Coord {
    return { x: Math.round(fCoord.x), y: Math.round(fCoord.y) };

  }
}

export class MathHelper {
  public static lerp(value1: number, value2: number, amount: number) {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
  }
}