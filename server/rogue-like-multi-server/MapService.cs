using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using rogue;

namespace rogue_like_multi_server
{
    public interface IMapService
    {
        Map Generate(int mapWidth, int mapHeight, string file, GameConfig config);
        FloatingCoord FindValidNextCoord(Map map, FloatingCoord startCoord, FloatingCoord? targetPosition, Aggressivity aggressivity, decimal velocity, decimal elapsedMs, int entityAggroDistance);
        Map CleanItems(Map map);
        Dictionary<string, Entity> CleanEntities(Dictionary<string, Entity> entities);
        Map FillMapWithRandomItems(Map map, Dictionary<ItemType, int> itemSpawns);
        Dictionary<string, Entity> FillMapWithRandomEntities(Map map, Dictionary<EntityType, int> entitySpawns, Dictionary<EntityType, LootTable> entityLoot);
        Map DropItems(Map map, IList<ItemType> items, Coord coord, bool notOnCell = false);
        Map DropDeadBody(Map map, int spriteId, Coord coord);
        List<ItemType> GetRandomEntityLoot(LootTable entityLoot);
        List<ItemType> GetRandomChestLoot(LootTable chestLoot);
        Map PickupItem(Map map, Coord coord);
        bool IsInRange(Coord coord, Map map);
    }

    public class MapService: IMapService
    {
        private IRandomGeneratorService _randomGeneratorService;
        private ILogger<MapService> _logger;

        public MapService(ILogger<MapService> logger, IRandomGeneratorService randomGeneratorService)
        {
            _randomGeneratorService = randomGeneratorService;
            _logger = logger;
        }

        public Map Generate(int mapWidth, int mapHeight, string file, GameConfig config)
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

            map = FillMapWithRandomItems(map, config.ItemSpawn);

            return map;
        }

        public Map CleanItems(Map map)
        {
            foreach (var itemKey in map.Items.Keys.ToList())
            {
                map.SetItem(itemKey, null);
            }

            return map;
        }

        public Dictionary<string, Entity> CleanEntities(Dictionary<string, Entity> entities)
        {
            return new Dictionary<string, Entity>();
        }

        public Map FillMapWithRandomItems(Map map, Dictionary<ItemType, int> itemSpawns)
        {
            foreach (var itemSpawn in itemSpawns)
            {
                for (var i = 0; i < itemSpawn.Value; i++)
                {
                    map = SetRandomPositionItem(map, new Coord(3, 3), new Coord(76 - 3, 81 - 3), itemSpawn.Key);
                }
            }

            return map;
        }

        public Dictionary<string, Entity> FillMapWithRandomEntities(Map map, Dictionary<EntityType, int> entitySpawns, Dictionary<EntityType, LootTable> entityLoot)
        {
            var entities = new Dictionary<string, Entity>();

            foreach (var entitySpawn in entitySpawns)
            {
                for (var i = 0; i < entitySpawn.Value; i++)
                {
                    entities = SetRandomPositionEntity(map, entities, new Coord(3, 3), new Coord(76 - 3, 81 - 3), entitySpawn.Key, entityLoot);
                }
            }

            return entities;
        }

        public FloatingCoord FindValidNextCoord(Map map, FloatingCoord startFloatingCoord, FloatingCoord? targetPosition, Aggressivity aggressivity, decimal velocity, decimal elapsedMs, int entityAggroDistance)
        {
            var multiplicator = velocity * Convert.ToDecimal(elapsedMs);

            // If we have a target player close enough
            if (aggressivity != Aggressivity.Neutral && targetPosition != null && FloatingCoord.Distance2d(startFloatingCoord, targetPosition.Value) < Convert.ToDecimal(entityAggroDistance))
            {
                var direction = targetPosition.Value - startFloatingCoord;
                var normalizedDirection = 1 / FloatingCoord.Distance(startFloatingCoord, targetPosition.Value) * direction;
                var newFloatingCoord2 = startFloatingCoord;
                var newFloatingCoord2Half = startFloatingCoord;
                var addition = multiplicator * normalizedDirection;
                if (aggressivity == Aggressivity.Aggressive) {
                    newFloatingCoord2 += addition;
                    newFloatingCoord2Half += 0.5m * addition;
                } else {
                    newFloatingCoord2 -= addition;
                    newFloatingCoord2Half -= 0.5m * addition;
                }

                var newCoord2 = newFloatingCoord2.ToCoord();
                var newCoordHalf2 = newFloatingCoord2Half.ToCoord(); // Just a bit more safety on passing through wall because the entity is too fast :/
                if (IsInRange(newCoord2, map) && map.Cells[newCoord2.X][newCoord2.Y].FloorType.IsWalkable()
                    && IsInRange(newCoordHalf2, map) && map.Cells[newCoordHalf2.X][newCoordHalf2.Y].FloorType.IsWalkable())
                {
                    return newFloatingCoord2;
                }

                _logger.Log(LogLevel.Warning, $"Entity tried to move but there is a wall");
                return startFloatingCoord;
            }

            // Random movements
            var possibleMovements = new List<FloatingCoord>();
            var startCoord = startFloatingCoord.ToCoord();
            for (var i = -1; i <= + 1; i++)
            {
                for (var j = -1; j <= + 1; j++)
                {
                    var coord = new Coord(startCoord.X + i, startCoord.Y + j);
                    if (!((i == -1 && j == -1) || (i == -1 && j == 1) || (i == 1 && j == -1) || (i == 1 && j == 1)) // Dirty way to avoid diagonals
                        && IsInRange(coord, map)
                        && map.Cells[coord.X][coord.Y].FloorType.IsWalkable())
                        possibleMovements.Add(new FloatingCoord(i, j));
                    else
                        possibleMovements.Add(new FloatingCoord(0, 0));
                }
            }
            if (possibleMovements.Count == 0)
                return startFloatingCoord;

            var index = _randomGeneratorService.Generate(0, possibleMovements.Count - 1);
            var newFloatingCoord = startFloatingCoord + multiplicator * possibleMovements[index]; // No need to normalize since no diagonals vector has a 1 length

            var newCoord = newFloatingCoord.ToCoord();
            if (!IsInRange(newCoord, map))
                return startFloatingCoord;

            if (map.Cells[newCoord.X][newCoord.Y].FloorType.IsWalkable())
                return newFloatingCoord;
            return startFloatingCoord;
        }

        public Map DropItems(Map map, IList<ItemType> items, Coord coord, bool notOnCell = false)
        {
            foreach (var item in items)
            {
                map = DropItem(map, item, coord, notOnCell);
            }

            return map;
        }

        public Map DropDeadBody(Map map, int spriteId, Coord coord)
        {
            switch (spriteId)
            {
                case 6:
                    map = DropItem(map, ItemType.DeadBody1, coord);
                    break;
                case 4:
                    map = DropItem(map, ItemType.DeadBody2, coord);
                    break;
                case 5:
                    map = DropItem(map, ItemType.DeadBody3, coord);
                    break;
            }
            return map;
        }

        public List<ItemType> GetRandomEntityLoot(LootTable lootTable)
        {
            var items = new List<ItemType>();

            foreach (var itemType in Enum.GetValues(typeof(ItemType)) as ItemType[])
            {
                var rarity = itemType.GetDropRate(lootTable);
                if (rarity > 0 && _randomGeneratorService.Generate(0, 100) <= rarity)
                {
                    items.Add(itemType);
                }
            }

            return items;
        }

        public List<ItemType> GetRandomChestLoot(LootTable chestLoot)
        {
            var items = new List<ItemType>();

            foreach (var itemType in Enum.GetValues(typeof(ItemType)) as ItemType[])
            {
                var rarity = itemType.GetDropRate(chestLoot);
                if (rarity > 0 && _randomGeneratorService.Generate(0, 100) <= rarity)
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
                    && (!map.Cells[newCoord.X][newCoord.Y].ItemType.HasValue || map.Cells[newCoord.X][newCoord.Y].ItemType.Value == ItemType.Empty)
                    && map.Cells[newCoord.X][newCoord.Y].FloorType.IsWalkable())
                {
                    map.SetItem(newCoord, item);
                    return map;
                }
            }
            return map;
        }

        public bool IsInRange(Coord coord, Map map)
        {
            return 0 <= coord.X && coord.X < map.MapWidth && 0 <= coord.Y && coord.Y < map.MapHeight;
        }

        private Map SetRandomPositionItem(Map map, Coord minCoord, Coord maxCoord, ItemType item)
        {
            int x;
            int y;
            var i = 0;
            do
            {
                i++;
                x = _randomGeneratorService.Generate(minCoord.X, maxCoord.X);
                y = _randomGeneratorService.Generate(minCoord.Y, maxCoord.Y);
            } while (
                // Not at the start zone between 44, 44 and 56, 56
                ((x >= 44 && x <= 56 && x >= 56 && y <= 56)
                // Not where there is already an item or on a wall
                || (map.Cells[x][y].ItemType != null && map.Cells[x][y].ItemType != ItemType.Empty || !map.Cells[x][y].FloorType.IsWalkable()))
                // stop condition
                && i <= 100
            );

            if (i > 100)
            {
                return null;
            }

            map.SetItem(new Coord(x, y), item);

            return map;
        }

        private Dictionary<string, Entity> SetRandomPositionEntity(Map map, Dictionary<string, Entity> entities, Coord minCoord, Coord maxCoord, EntityType entityType, Dictionary<EntityType, LootTable> entityLoot)
        {
            int x;
            int y;
            var i = 0;
            do
            {
                i++;
                x = _randomGeneratorService.Generate(minCoord.X, maxCoord.X);
                y = _randomGeneratorService.Generate(minCoord.Y, maxCoord.Y);
            } while (
                // Not at the start zone between 44, 44 and 56, 56
                ((x >= 44 && x <= 56 && y >= 44 && y <= 56)
                // Not where there is already an item or on a wall
                ||  !map.Cells[x][y].FloorType.IsWalkable())
                // stop condition
                && i <= 100);

            if (i > 100)
            {
                return null;
            }

            var name = "e_" + entityType.ToString() + '-' + Guid.NewGuid();
            entities.Add(name, new Entity(new FloatingCoord(x, y), name, (int) entityType, GetRandomEntityLoot(entityLoot[entityType]), entityType.GetMaxPv(), entityType.GetDamage(), entityType.GetAggressivity()));

            return entities;
        }
    }
}