using System;

namespace rogue_like_multi_server
{
    public class Map
    {
        public Cell[][] Cells;
        public const int MapWidth = 100;
        public const int MapHeight = 100;
        private const int WallPosition = 20;

        public Map()
        {

        }

        public static Map Generate()
        {
            var board = new Map();
            board.Cells = new Cell[MapWidth][];
            for (int i = 0; i < MapWidth; i++) {
                board.Cells[i] = new Cell[MapHeight];
                for (int j = 0; j < MapHeight; j++) {
                    board.Cells[i][j] = new Cell(GetRandomSpriteId(), null);
                }
            }

            for (int i = 0; i < MapWidth; i++)
            {
                board.Cells[i][WallPosition] = new Cell(FloorType.Wall, null);
            }

            board.Cells[GetRandomNumber(3, MapWidth-3)][WallPosition] = new Cell(FloorType.ClosedDoor, null);

            board.Cells[GetRandomNumber(3, MapWidth - 3)][GetRandomNumber(3, WallPosition-1)].ItemType = ItemType.Key;

            return board;
        }

        private static FloorType GetRandomSpriteId() {
            Random random = new Random();
            FloorType[] okSpriteId = {FloorType.Plain, FloorType.Plain, FloorType.Plain, FloorType.Plain, FloorType.Flowers,
                FloorType.Flowers, FloorType.Sprout, FloorType.Evergreen, FloorType.Tree, FloorType.Trees};
            return okSpriteId[random.Next(0, okSpriteId.Length)];
        }

        private static int GetRandomNumber(int min, int max)
        {
            Random random = new Random();
            return random.Next(min, max+1);
        }
    }
}