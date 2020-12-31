using rogue;

namespace rogue_like_multi_server
{
    public class Map
    {
        public Cell[][] Cells;
        public int MapWidth = 100;
        public int MapHeight = 100;

        public Map(int mapWidth, int mapHeight)
        {
            MapWidth = mapWidth;
            MapHeight = mapHeight;

            Cells = new Cell[mapWidth][];
            for (var i = 0; i < mapWidth; i++)
            {
                Cells[i] = new Cell[mapHeight];
            }
        }

        public void SetCell(int i, int j, FloorType floorType)
        {
            Cells[i][j] = new Cell(floorType, null);
        }

        public void SetItem(int i, int j, ItemType? item)
        {
            Cells[i][j].ItemType = item;
        }
    }
}