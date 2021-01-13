using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using rogue;

namespace rogue_like_multi_server
{
    public interface IMapService
    {
        Map Generate(int mapWidth, int mapHeight, string file);
        Map DropItems(Map map, IList<ItemType> items, Coord coord);
        Map PickupItem(Map map, Coord coord);
    }

    public class MapService: IMapService
    {
        private IRandomGeneratorService _randomGeneratorService;

        public MapService(IRandomGeneratorService randomGeneratorService)
        {
            _randomGeneratorService = randomGeneratorService;
        }

        public Map Generate(int mapWidth, int mapHeight, string file)
        {
            var map = new Map(mapWidth, mapHeight);

            string mapJson = File.ReadAllText(file);

            MapFile mapFile = JsonConvert.DeserializeObject<MapFile>(mapJson);

            var mapLayer = mapFile.Layers.FirstOrDefault(x => x.Name == "Map");
            var objectsLayer = mapFile.Layers.FirstOrDefault(x => x.Name == "Objects");
            if (mapLayer == null || objectsLayer == null || mapLayer.Data.Length < mapWidth*mapHeight || objectsLayer.Data.Length < mapWidth*mapHeight)
            {
                throw new ArgumentException($"Given map file {mapJson} is wrongly formatted");
            }

            for (int i = 0; i < mapWidth; i++)
            {
                for (int j = 0; j < mapHeight; j++)
                {
                    map.SetCell(i, j, (FloorType) mapLayer.Data[i + j * mapWidth] - 1);
                }
            }

            for (int i = 0; i < mapWidth; i++)
            {
                for (int j = 0; j < mapHeight; j++)
                {
                    map.SetItem(i, j, (ItemType) objectsLayer.Data[i + j * mapWidth] - 1);
                }
            }

            // Objects
            for (var i = 0; i < 5; i++)
            {
                map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(76 - 3, 81 - 3),
                    ItemType.Wood);
            }

            for (var i = 0; i < 10; i++)
            {
                map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(76 - 3, 81 - 3),
                    ItemType.Food);
            }

            for (var i = 0; i < 5; i++)
            {
                map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(76 - 3, 81 - 3),
                    ItemType.Key);
            }

            for (var i = 0; i < 135; i++)
            {
                map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(76 - 3, 81 - 3),
                    ItemType.Sword);
            }

            for (var i = 0; i < 50; i++)
            {
                map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(76 - 3, 81 - 3),
                    ItemType.Armor);
            }

            for (var i = 0; i < 135; i++)
            {
                map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(76 - 3, 81 - 3),
                    ItemType.HealthPotion);
            }

            return map;
        }

        public Map DropItems(Map map, IList<ItemType> items, Coord coord)
        {
            foreach (var item in items)
            {
                map = DropItem(map, item, coord);
            }

            return map;
        }

        public Map PickupItem(Map map, Coord coord)
        {
            var itemType = map.Cells[coord.X][coord.Y].ItemType;
            map.SetItem(coord.X, coord.Y, null);

            // If it was food make it respawn
            if (itemType == ItemType.Food)
            {
                map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(9, 9),
                ItemType.Food);
            }

            return map;
        }

        private Map DropItem(Map map, ItemType item, Coord baseCoord)
        {
            // 10 is just a hard limit
            for (var distance = 0; distance < 10; distance++)
            for (var i = -distance; i <= distance; i++)
            for (var j = -distance; j <= distance; j++)
            {
                var newCoord = baseCoord + new Coord(i, j);
                if (IsInRange(newCoord, map)
                    && (map.Cells[newCoord.X][newCoord.Y].ItemType == null || map.Cells[newCoord.X][newCoord.Y].ItemType == ItemType.Empty)
                    && map.Cells[newCoord.X][newCoord.Y].FloorType.IsWalkable())
                {
                    map.SetItem(newCoord.X, newCoord.Y, item);
                    return map;
                }
            }
            return map;
        }

        private bool IsInRange(Coord coord, Map map)
        {
            return 0 <= coord.X && coord.X < map.MapWidth && 0 <= coord.Y && coord.Y < map.MapHeight;
        }

        private Map SetRandomPositionObject(Map map, Coord minCoord, Coord maxCoord, ItemType item)
        {
            int x;
            int y;
            var i = 0;
            do
            {
                i++;
                x = GetRandomNumber(minCoord.X, maxCoord.X);
                y = GetRandomNumber(minCoord.Y, maxCoord.Y);
            } while ((map.Cells[x][y].ItemType != null && map.Cells[x][y].ItemType != ItemType.Empty || !map.Cells[x][y].FloorType.IsWalkable()) || i > 100);

            if (map.Cells[x][y].ItemType != null && map.Cells[x][y].ItemType != ItemType.Empty || !map.Cells[x][y].FloorType.IsWalkable())
            {
                return null;
            }

            map.SetItem(x, y, item);

            return map;
        }
        private FloorType GetRandomSpriteId() {
            FloorType[] okSpriteId = {FloorType.Plain, FloorType.Plain, FloorType.Plain, FloorType.Plain, FloorType.Flowers,
                FloorType.Flowers, FloorType.Sprout, FloorType.Evergreen, FloorType.Tree, FloorType.Trees};
            return okSpriteId[_randomGeneratorService.Generate(0, okSpriteId.Length)];
        }

        private int GetRandomNumber(int min, int max)
        {
            return _randomGeneratorService.Generate(min, max+1);
        }
    }
}