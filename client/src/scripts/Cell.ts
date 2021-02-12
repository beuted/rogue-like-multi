export type Cell = {
  floorType: FloorType,
  itemType: ItemType
}

export enum FloorType {
  Plain = 11,
  Wall = 1,
  ClosedDoor = 24,
  OpenDoor = 25,
  Cross2 = 30,
  ClosedChest = 39,
  Flowers = 44,
  Sprout = 45,
  Evergreen = 54,
  Tree = 55,
  Trees = 56,
  StreetLamp = 88,
  CampFire = 89,
  Floor1 = 123,
  Floor2 = 124,
  Floor3 = 125,
  Floor4 = 126,
  Floor5 = 127,
  Floor6 = 133,
  Floor7 = 134,
  Floor8 = 135,
  Floor9 = 136,
  Floor10 = 137,
  Floor11 = 143,
  Floor12 = 144,
  Floor13 = 145,
  Floor14 = 146,
  Floor15 = 147,
  Floor16 = 150,
  Floor17 = 151,
  Floor18 = 154,
  Floor19 = 155,
  Floor20 = 156,
  Floor21 = 157,
  Floor22 = 171,
  Floor23 = 172,
  Floor24 = 173,
  Floor25 = 176,
  Floor26 = 177,
  Floor27 = 178,
  Floor28 = 181,
  Floor29 = 182,
  Floor30 = 183,
  Floor31 = 186,
  Floor32 = 187,
  Floor33 = 188,
  Floor34 = 193,
  Floor35 = 198,
  Floor36 = 201,
  Floor37 = 202,
  Floor38 = 203
}

export enum ItemType {
  Empty = -1,
  Key = 57,
  Sword = 46,
  Armor = 49,
  Food = 58,
  Wood = 100,
  Blood = 102,
  HealthPotion = 103,
  Backpack = 105,
  Emerald = 106,
  DeadBody1 = 118,
  DeadBody2 = 218,
  DeadBody3 = 228,
}

export class CellHelper {
  private static walkableFloorTypes: FloorType[] = [FloorType.Plain, FloorType.Flowers, FloorType.Sprout,
  FloorType.Evergreen, FloorType.Tree, FloorType.Trees, FloorType.OpenDoor, FloorType.CampFire,
  FloorType.Floor1,
  FloorType.Floor2,
  FloorType.Floor3,
  FloorType.Floor4,
  FloorType.Floor5,
  FloorType.Floor6,
  FloorType.Floor7,
  FloorType.Floor8,
  FloorType.Floor9,
  FloorType.Floor10,
  FloorType.Floor11,
  FloorType.Floor12,
  FloorType.Floor13,
  FloorType.Floor14,
  FloorType.Floor15,
  FloorType.Floor16,
  FloorType.Floor17,
  FloorType.Floor18,
  FloorType.Floor19,
  FloorType.Floor20,
  FloorType.Floor21,
  FloorType.Floor22,
  FloorType.Floor23,
  FloorType.Floor24,
  FloorType.Floor25,
  FloorType.Floor26,
  FloorType.Floor27,
  FloorType.Floor28,
  FloorType.Floor29,
  FloorType.Floor30,
  FloorType.Floor31,
  FloorType.Floor32,
  FloorType.Floor33,
  FloorType.Floor34,
  FloorType.Floor35,
  FloorType.Floor36,
  FloorType.Floor37,
  FloorType.Floor38];

  private static hidingFloorTypes: FloorType[] = [FloorType.Evergreen, FloorType.Tree, FloorType.Trees];
  private static closedFloorTypes: FloorType[] = [FloorType.ClosedDoor, FloorType.ClosedChest];

  public static isWalkable(cell: Cell, hasKey: boolean) {
    return (hasKey && CellHelper.closedFloorTypes.indexOf(cell.floorType) != -1) || CellHelper.walkableFloorTypes.indexOf(cell.floorType) != -1;
  }

  public static isHiding(cell: Cell) {
    return CellHelper.hidingFloorTypes.indexOf(cell.floorType) != -1;
  }

  public static getCellSpriteId(cell: Cell): number {
    if (cell.itemType == null || cell.itemType == ItemType.Empty)
      return cell.floorType;
    return cell.itemType;
  }
}
