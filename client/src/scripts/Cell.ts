export type Cell = {
  floorType: FloorType,
  itemType: ItemType
}

export enum FloorType {
  Plain = 11,
  Wall = 1,
  ClosedDoor = 24,
  OpenDoor = 25,
  Flowers = 44,
  Sprout = 45,
  Evergreen = 54,
  Tree = 55,
  Trees = 56,
  CampFire = 89
}

export enum ItemType {
  Key = 57,
  Bag = 27
}

export class CellHelper {
  private static walkableFloorTypes: FloorType[] = [FloorType.Plain, FloorType.Flowers, FloorType.Sprout,
    FloorType.Evergreen, FloorType.Tree, FloorType.Trees, FloorType.OpenDoor, FloorType.CampFire];

  public static isWalkable(cell: Cell) {
    return CellHelper.walkableFloorTypes.findIndex(x => x == cell.floorType) != -1;
  }

  public static getCellSpriteId(cell: Cell) : number {
    if (cell.itemType == null)
      return cell.floorType;
    return cell.itemType;
  }
}
