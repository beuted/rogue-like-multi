using System.Linq;

namespace rogue_like_multi_server
{
    public enum FloorType
    {
        Plain = 11,
        Wall = 1,
        ClosedDoor = 24,
        OpenDoor = 25,
        Flowers = 44,
        Sprout = 45,
        Evergreen = 54,
        Tree = 55,
        Trees = 56
    }

    public static class FloorTypeExtensions
    {
        private static readonly FloorType[] WalkableFloorTypes = { FloorType.Plain, FloorType.Flowers, FloorType.Sprout,
                                                          FloorType.Evergreen, FloorType.Tree, FloorType.Trees, FloorType.OpenDoor };

        public static bool IsWalkable(this FloorType floorType)
        {
            return WalkableFloorTypes.Contains(floorType);
        }
    }

}