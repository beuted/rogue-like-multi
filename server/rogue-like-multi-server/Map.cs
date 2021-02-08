using Newtonsoft.Json;
using rogue;
using System.Collections.Generic;

namespace rogue_like_multi_server
{
    public class Map
    {
        [JsonProperty("cells")]
        public Cell[][] Cells;

        [JsonIgnore()]
        public int MapWidth = 100;

        [JsonIgnore()]
        public int MapHeight = 100;

        // To avoid sending the whole map everytime
        [JsonProperty("items")]
        public Dictionary<Coord, ItemType> Items;

        [JsonProperty("changingFloors")]
        public Dictionary<Coord, FloorType> ChangingFloor;

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
            ChangingFloor = new Dictionary<Coord, FloorType>();
        }

        public Map(Dictionary<Coord, ItemType> items, Dictionary<Coord, FloorType> changingFloor)
        {
            Items = items;
            ChangingFloor = changingFloor;
        }

        public void SetFloorType(Coord coord, FloorType floorType)
        {
            Cells[coord.X][coord.Y].FloorType = floorType;

            if (ChangingFloor[coord].IsChanging())
                ChangingFloor[coord] = floorType;
        }

        public void SetCell(Coord coord, FloorType floorType)
        {
            Cells[coord.X][coord.Y] = new Cell(floorType, null);

            if (floorType.IsChanging())
                ChangingFloor.Add(coord, floorType);
        }

        public void SetItem(Coord coord, ItemType? item)
        {
            Cells[coord.X][coord.Y].ItemType = item;

            Items.Remove(coord); //TODO we should not overrids, weird have a look at this
            if (item.HasValue && item.Value!= ItemType.Empty)
            {
                Items.Add(coord, item.Value);
            }
        }
    }
}