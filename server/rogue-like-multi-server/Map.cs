using EpPathFinding.cs;
using rogue;

namespace rogue_like_multi_server
{
    public class Map
    {
        public Cell[][] Cells;
        public int MapWidth = 100;
        public int MapHeight = 100;
        public BaseGrid SearchGrid;

        public Map(int mapWidth, int mapHeight)
        {
            SearchGrid = new StaticGrid(mapWidth, mapHeight);
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
            SearchGrid.SetWalkableAt(i, j, floorType.IsWalkable());
        }

        public void SetItem(int i, int j, ItemType? item)
        {
            Cells[i][j].ItemType = item;
        }
    }
}