using System;

namespace rogue_like_multi_server
{
    public class Map
    {
        public Cell[][] Cells;
        public const int MapWidth = 20;
        public const int MapHeight = 20;

        public Map()
        {

        }

        public static Map Generate()
        {
            var map = new Map();
            map.Cells = new Cell[MapHeight][];
            for (int i = 0; i < MapHeight; i++) {
                map.Cells[i] = new Cell[MapWidth];
                for (int j = 0; j < MapWidth; j++) {
                    map.Cells[i][j] = new Cell(GetRandomSpriteId());
                }
            }

            return map;
        }

        private static FloorType GetRandomSpriteId() {
            Random random = new Random(); ;
            FloorType[] okSpriteId = {FloorType.Plain, FloorType.Plain, FloorType.Plain, FloorType.Plain, FloorType.Flowers,
                FloorType.Flowers, FloorType.Sprout, FloorType.Evergreen, FloorType.Tree, FloorType.Trees};
            return okSpriteId[random.Next(0, okSpriteId.Length)];
        }
    }
}