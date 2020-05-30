using System;
using System.Collections.Generic;
using rogue;

namespace rogue_like_multi_server
{
    public interface IMapService
    {
        Map Generate(int mapWidth, int mapHeight);
        Map DropItems(Map boardStateDynamic, IList<ItemType> items, Coord coord);
    }

    public class MapService: IMapService
    {
        private const int WallPosition = 20;

        public Map Generate(int mapWidth, int mapHeight)
        {
            var map = new Map(mapWidth, mapHeight);
            for (int i = 0; i < mapWidth; i++) {
                for (int j = 0; j < mapHeight; j++)
                {
                    map.SetCell(i, j, GetRandomSpriteId());
                }
            }

            for (int i = 5; i < mapWidth-5; i++)
            {
                map.SetCell(i, WallPosition, FloorType.Wall);
            }

            map.SetCell(GetRandomNumber(3, mapWidth-3), WallPosition, FloorType.ClosedDoor);
            map.SetCell(5, 5, FloorType.CampFire);

            // 1 Key
            map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(mapWidth - 3, WallPosition - 1),
                ItemType.Key);

            // 4 bags
            map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(mapWidth - 3, WallPosition - 1),
                ItemType.Bag);
            map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(mapWidth - 3, WallPosition - 1),
                ItemType.Bag);
            map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(mapWidth - 3, WallPosition - 1),
                ItemType.Bag);
            map = SetRandomPositionObject(map, new Coord(3, 3), new Coord(mapWidth - 3, WallPosition - 1),
                ItemType.Bag);

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

        private Map DropItem(Map map, ItemType item, Coord baseCoord)
        {
            // 10 is just a hard limit
            for (var distance = 0; distance < 10; distance++)
            for (var i = -distance; i <= distance; i++)
            for (var j = -distance; j <= distance; j++)
            {
                var newCoord = baseCoord + new Coord(i, j);
                if (IsInRange(newCoord, map) &&
                    map.Cells[newCoord.X][newCoord.Y].ItemType == null)
                {
                    map.SetItem(newCoord.X,newCoord.Y, item);
                    return map;
                }
            }
            return map;
        }

        private bool IsInRange(Coord coord, Map map)
        {
            return 0 <= coord.X && coord.X < map.MapWidth && 0 <= coord.Y && coord.Y < map.MapHeight;
        }

        private static Map SetRandomPositionObject(Map map, Coord minCoord, Coord maxCoord, ItemType item)
        {
            int x;
            int y;
            var i = 0;
            do
            {
                i++;
                x = GetRandomNumber(minCoord.X, maxCoord.X);
                y = GetRandomNumber(minCoord.Y, maxCoord.Y);
            } while (map.Cells[x][y].ItemType != null || i > 100);

            if (map.Cells[x][y].ItemType != null)
            {
                return null;
            }

            map.SetItem(x, y, item);

            return map;
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