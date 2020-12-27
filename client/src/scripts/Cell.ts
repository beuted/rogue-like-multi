export type Cell = {
  floorType: FloorType,
  itemType: ItemType
}

export enum FloorType {
  Plain = 11,
  Wall = 1,
  ClosedDoor = 24,
  OpenDoor = 25,
  BorderWallRight = 30,
  BorderWallLeft = 31,
  Flowers = 44,
  Sprout = 45,
  Evergreen = 54,
  Tree = 55,
  Trees = 56,
  StreetLamp = 88,
  CampFire = 89
}

export enum ItemType {
  Empty = -1,
  Key = 57,
  Bag = 27,
  Food = 58,
  wood = 100
}

export class CellHelper {
  private static walkableFloorTypes: FloorType[] = [FloorType.Plain, FloorType.Flowers, FloorType.Sprout,
    FloorType.Evergreen, FloorType.Tree, FloorType.Trees, FloorType.OpenDoor, FloorType.CampFire, FloorType.BorderWallLeft,
    FloorType.BorderWallRight];

    private static hidingFloorTypes: FloorType[] = [FloorType.Evergreen, FloorType.Tree, FloorType.Trees];

  public static isWalkable(cell: Cell) {
    return CellHelper.walkableFloorTypes.findIndex(x => x == cell.floorType) != -1;
  }

  public static isHiding(cell: Cell) {
    return CellHelper.hidingFloorTypes.findIndex(x => x == cell.floorType) != -1;
  }

  public static getCellSpriteId(cell: Cell) : number {
    if (cell.itemType == null || cell.itemType == ItemType.Empty)
      return cell.floorType;
    return cell.itemType;
  }
}
