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
        FloatingCoord FindValidMovment(Map map, FloatingCoord startCoord, FloatingCoord? targetPosition, decimal velocity, decimal elapsedMs);
        Map CleanMap(Map map);
        Map FillMapWithRandomObjects(Map map, Dictionary<ItemType, int> itemSpawns);
        Map DropItems(Map map, IList<ItemType> items, Coord coord, bool notOnCell = false);
        List<ItemType> GetRandomLoot(int modificator = 0);
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
                    map.SetCell(new Coord(i, j), (FloorType) mapLayer.Data[i + j * mapWidth] - 1);
                }
            }

            for (int i = 0; i < mapWidth; i++)
            {
                for (int j = 0; j < mapHeight; j++)
                {
                    map.SetItem(new Coord(i, j), (ItemType) objectsLayer.Data[i + j * mapWidth] - 1);
                }
            }

            map = FillMapWithRandomObjects(map, new Dictionary<ItemType, int>() {
                { ItemType.Wood, 5 },
                { ItemType.Food, 10 },
                { ItemType.Key, 5 },
                { ItemType.Sword, 5 },
                { ItemType.Backpack, 5 },
                { ItemType.HealthPotion, 5 },
            });

            return map;
        }

        public Map CleanMap(Map map)
        {
            foreach (var itemKey in map.Items.Keys.ToList())
            {
                map.SetItem(itemKey, null);
            }

            return map;
        }

        public Map FillMapWithRandomObjects(Map map, Dictionary<ItemType, int> itemSpawns)
        {
            foreach (var itemSpawn in itemSpawns)
            {
                for (var i = 0; i < itemSpawn.Value; i++)
                {
                    map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(76 - 3, 81 - 3), itemSpawn.Key);
                }
            }         

            return map;
        }

        public FloatingCoord FindValidMovment(Map map, FloatingCoord startFloatingCoord, FloatingCoord? targetPosition, decimal velocity, decimal elapsedMs)
        {
            var multiplicator = velocity * Convert.ToDecimal(elapsedMs);

            // If we have a target player close enough
            if (targetPosition != null && FloatingCoord.Distance2d(startFloatingCoord, targetPosition.Value) < 5m)
            {
                var direction = targetPosition.Value - startFloatingCoord;
                // We should normalize or transform into one of 9 directions but la flemme
                var greaterDimension = Math.Max(Math.Abs(direction.X), Math.Abs(direction.Y));
                return (multiplicator / greaterDimension) * direction;
            }

            // Random movements
            var possibleMovements = new List<FloatingCoord>();
            var startCoord = startFloatingCoord.ToCoord();
            for (var i = Math.Max(0, startCoord.X - 1); i <= Math.Min(map.MapWidth, startCoord.X) + 1; i++)
            {
                for (var j = Math.Max(0, startCoord.X - 1); j <= Math.Min(map.MapHeight, startCoord.X) + 1; j++)
                {
                    // Dirty way to avoid diagonals
                    if (map.Cells[i][j].FloorType.IsWalkable() && !((i==-1 && j==-1) || (i == -1 && j == 1) || (i == 1 && j == -1) || (i == 1 && j == 1)))
                        possibleMovements.Add(new FloatingCoord(i, j));
                    else
                        possibleMovements.Add(startFloatingCoord);
                }
            }
            if (possibleMovements.Count == 0)
                return new FloatingCoord(0, 0);

            var index = GetRandomNumber(0, possibleMovements.Count - 1);
            return multiplicator * (possibleMovements[index] - startFloatingCoord); // No need to normalize since no diagonals vector has a 1 length
        }

        public Map DropItems(Map map, IList<ItemType> items, Coord coord, bool notOnCell = false)
        {
            foreach (var item in items)
            {
                map = DropItem(map, item, coord, notOnCell);
            }

            return map;
        }

        public List<ItemType> GetRandomLoot(int modificator = 0)
        {
            var items = new List<ItemType>();

            foreach (var itemType in Enum.GetValues(typeof(ItemType)) as ItemType[])
            {
                var rarity = itemType.GetDropRate(modificator);
                if (rarity > 0 && GetRandomNumber(0, 100) <= rarity)
                {
                    items.Add(itemType);
                }
            }

            return items;
        }

        public Map PickupItem(Map map, Coord coord)
        {
            map.SetItem(coord, null);

            return map;
        }

        private Map DropItem(Map map, ItemType item, Coord baseCoord, bool notOnCell = false)
        {
            // 10 is just a hard limit
            for (var distance = notOnCell ? 1 : 0; distance < 10; distance++)
            for (var i = -distance; i <= distance; i++)
            for (var j = -distance; j <= distance; j++)
            {
                var newCoord = baseCoord + new Coord(i, j);
                if (IsInRange(newCoord, map)
                    && (map.Cells[newCoord.X][newCoord.Y].ItemType == null || map.Cells[newCoord.X][newCoord.Y].ItemType == ItemType.Empty)
                    && map.Cells[newCoord.X][newCoord.Y].FloorType.IsWalkable())
                {
                    map.SetItem(newCoord, item);
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

            map.SetItem(new Coord(x, y), item);

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