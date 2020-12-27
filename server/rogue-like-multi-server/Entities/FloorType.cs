using System.Linq;

namespace rogue
{
    public enum FloorType
    {
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
        CampFire = 89
    }

    public static class FloorTypeExtensions
    {
        private static readonly FloorType[] WalkableFloorTypes = { FloorType.Plain, FloorType.Flowers, FloorType.Sprout,
                                                          FloorType.Evergreen, FloorType.Tree, FloorType.Trees, FloorType.OpenDoor,
                                                          FloorType.CampFire, FloorType.BorderWallLeft, FloorType.BorderWallRight };

        public static bool IsWalkable(this FloorType floorType)
        {
            return WalkableFloorTypes.Contains(floorType);
        }
    }
}