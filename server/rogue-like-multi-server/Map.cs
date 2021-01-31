using Newtonsoft.Json;
using rogue;
using System.Collections.Generic;

namespace rogue_like_multi_server
{
    public class Map
    {
        [JsonProperty("cells")]
        public Cell[][] Cells;

        [JsonProperty("mapWidth")]
        public int MapWidth = 100;

        [JsonProperty("mapHeight")]
        public int MapHeight = 100;

        // For easier item management: TODO maybe send this to front-end
        [JsonIgnore()]
        public Dictionary<Coord, ItemType> Items;

        public Map(int mapWidth, int mapHeight)
        {
            MapWidth = mapWidth;
            MapHeight = mapHeight;

            Cells = new Cell[mapWidth][];
            for (var i = 0; i < mapWidth; i++)
            {
                Cells[i] = new Cell[mapHeight];
            }
            Items = new Dictionary<Coord, ItemType>();
        }

        public void SetCell(Coord coord, FloorType floorType)
        {
            Cells[coord.X][coord.Y] = new Cell(floorType, null);
        }

        public void SetItem(Coord coord, ItemType? item)
        {
            Cells[coord.X][coord.Y].ItemType = item;

            Items.Remove(coord); //TODO we should not overrids, weird have a look at this
            if (item.HasValue)
            {
                Items.Add(coord, item.Value);
            }
        }
    }
}