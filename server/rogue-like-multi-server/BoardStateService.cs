using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace rogue_like_multi_server
{
    public class BoardStateService: IBoardStateService
    {
        private readonly ILogger<BoardStateService> _logger;

        public BoardStateService(ILogger<BoardStateService> logger)
        {
            _logger = logger;
        }

        public BoardState Generate()
        {
            return new BoardState(
                GenerateStatic(),
                GenerateDynamic()
            );
        }

        public BoardStateDynamic Update(BoardStateDynamic boardStateDynamic)
        {
            // Kill entities with 0 pv (remove them from map)
            var keysToRemove = new List<string>();
            foreach (var entity in boardStateDynamic.Entities)
            {
                if (entity.Value.Pv <= 0)
                {
                    keysToRemove.Add(entity.Key);
                }
            }
            foreach (var keyToRemove in keysToRemove)
            {
                boardStateDynamic = DropItems(boardStateDynamic, boardStateDynamic.Entities[keyToRemove].Inventory, boardStateDynamic.Entities[keyToRemove].Coord);
                boardStateDynamic.Entities.Remove(keyToRemove);
            }

            // Kill players with 0 pv (remove them from map)
            var keysToRemovePlayers = new List<string>();
            foreach (var player in boardStateDynamic.Players)
            {
                if (player.Value.Entity.Pv <= 0)
                {
                    keysToRemovePlayers.Add(player.Key);
                }
            }
            foreach (var keyToRemove in keysToRemovePlayers)
            {
                boardStateDynamic = DropItems(boardStateDynamic, boardStateDynamic.Players[keyToRemove].Entity.Inventory, boardStateDynamic.Players[keyToRemove].Entity.Coord);
                boardStateDynamic.Players.Remove(keyToRemove);
            }

            // IA Stuff
            foreach (var entity in boardStateDynamic.Entities)
            {
                Random random = new Random();
                var diffX = random.Next(0, 3) - 1;

                Random random2 = new Random();
                var diffY = random2.Next(0, 3) -1;

                entity.Value.Coord += new Coord(diffX, diffY);


                if (entity.Value.Coord.X > 19)
                    entity.Value.Coord = new Coord(19, entity.Value.Coord.Y);
                if (entity.Value.Coord.X < 0)
                    entity.Value.Coord = new Coord(0, entity.Value.Coord.Y);
                if (entity.Value.Coord.Y > 19)
                    entity.Value.Coord = new Coord(entity.Value.Coord.X, 19);
                if (entity.Value.Coord.Y < 0)
                    entity.Value.Coord = new Coord(entity.Value.Coord.X, 0);
            }

            return boardStateDynamic;
        }

        private BoardStateDynamic DropItems(BoardStateDynamic boardStateDynamic, IList<ItemType> items, Coord coord)
        {
            foreach (var item in items)
            {
                boardStateDynamic = DropItem(boardStateDynamic, item, coord);
            }

            return boardStateDynamic;
        }

        private BoardStateDynamic DropItem(BoardStateDynamic boardStateDynamic, ItemType item, Coord baseCoord)
        {
            // 10 is just a hard limit
            for (var distance = 0; distance < 10; distance++)
            for (var i = -distance; i <= distance; i++)
            for (var j = -distance; j <= distance; j++)
            {
                var newCoord = baseCoord + new Coord(i, j);
                if (boardStateDynamic.Map.IsInRange(newCoord) &&
                    boardStateDynamic.Map.Cells[newCoord.X][newCoord.Y].ItemType == null)
                {
                    boardStateDynamic.Map.Cells[newCoord.X][newCoord.Y].ItemType = item;
                    return boardStateDynamic;
                }
            }
            return boardStateDynamic;
        }

        public BoardStateDynamic SetPlayerPosition(long time, BoardStateDynamic boardStateDynamic, Map map, string playerName,
            Coord coord)
        {
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to move but he doesn't exist on the server");
                return boardStateDynamic;
            }

            if (Coord.Distance(player.Entity.Coord, coord) > 1)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to move farther than 1 in a single turn");
                return boardStateDynamic;
            }

            if (player.LastAction == time)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to play twice this turn");
                return boardStateDynamic;
            }

            if (!map.Cells[coord.X][coord.Y].FloorType.IsWalkable())
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to move on {coord} but it is not walkable");
                return boardStateDynamic;
            }

            player.Entity.Coord = coord;

            // Pickup objects
            if (map.Cells[coord.X][coord.Y].ItemType != null)
            {
                player.Entity.Inventory.Add(map.Cells[coord.X][coord.Y].ItemType.Value);
                map.Cells[coord.X][coord.Y].ItemType = null;
            }

            // Drop bags at CampFire
            if (map.Cells[coord.X][coord.Y].FloorType == FloorType.CampFire && player.Entity.Inventory.Contains(ItemType.Bag))
            {
                int nbBags = player.Entity.Inventory.RemoveAll(item => item == ItemType.Bag);
                boardStateDynamic.NbBagsFound += nbBags;
                if (boardStateDynamic.NbBagsFound >= 4)
                {
                    boardStateDynamic.WinnerTeam = Team.Good;
                }
            }

            player.LastAction = time;

            return boardStateDynamic;
        }

        public BoardStateDynamic AddPlayer(BoardStateDynamic boardStateDynamic, string playerName, Coord coord)
        {
            if (boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Information, $"Player {playerName} tried to be added at {coord} but he already exist at position {player.Entity.Coord} on the server");
                player.IsConnected = true;
                return boardStateDynamic;
            }
            boardStateDynamic.Players.Add(playerName, new Player(new Entity(coord, playerName, 6, new List<ItemType>(), 3), null, true));

            return boardStateDynamic;
        }

        public BoardStateDynamic RemovePlayer(BoardStateDynamic boardStateDynamic, string playerName)
        {
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to be removed but he doesn't exist on the server");
                return boardStateDynamic;
            }
            // We just mark it as disconnected to remember his coord and all if he reconnects
            player.IsConnected = false;

            return boardStateDynamic;
        }

        public BoardStateDynamic PlayerActionAttack(long time, BoardStateDynamic boardStateDynamic, string playerName)
        {
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var attackingPlayer))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to attack but he doesn't exist on the server");
                return boardStateDynamic;
            }

            foreach (var entity in boardStateDynamic.Entities)
            {
                if (Coord.Distance2d(attackingPlayer.Entity.Coord, entity.Value.Coord) <= 1)
                {
                    entity.Value.Pv--;
                }
            }

            foreach (var player in boardStateDynamic.Players)
            {
                if (attackingPlayer.Entity.Name != player.Value.Entity.Name && Coord.Distance2d(attackingPlayer.Entity.Coord, player.Value.Entity.Coord) <= 1)
                {
                    player.Value.Entity.Pv--;
                }
            }

            attackingPlayer.LastAction = time;

            return boardStateDynamic;
        }


        private BoardStateStatic GenerateStatic()
        {
            return new BoardStateStatic(
            );
        }

        private BoardStateDynamic GenerateDynamic()
        {
            return new BoardStateDynamic(
                Map.Generate(),
                new Dictionary<string, Entity>()
                {
                    { "pwet", new Entity(new Coord(10, 10), "pwet", 7, new List<ItemType>()
                    {
                        ItemType.Bag, ItemType.Bag, ItemType.Key, ItemType.Key, ItemType.Bag, ItemType.Bag, ItemType.Bag, ItemType.Bag, ItemType.Bag, ItemType.Bag
                    }, 3) }
                },
                new Dictionary<string, Player>(),
                0,
                Team.None
            );
        }
    }

    public interface IBoardStateService
    {
        BoardState Generate();

        BoardStateDynamic Update(BoardStateDynamic boardStateDynamic);

        BoardStateDynamic SetPlayerPosition(long time, BoardStateDynamic boardStateDynamic, Map name, string playerName,
            Coord coord);

        BoardStateDynamic AddPlayer(BoardStateDynamic boardStateDynamic, string playerName, Coord coord);

        BoardStateDynamic RemovePlayer(BoardStateDynamic boardStateDynamic, string playerName);

        BoardStateDynamic PlayerActionAttack(long time, BoardStateDynamic boardStateDynamic, string playerName);
    }
}