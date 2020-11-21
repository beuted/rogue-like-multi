using System;
using System.Collections.Generic;
using System.Linq;
using EpPathFinding.cs;
using Microsoft.Extensions.Logging;
using rogue;

namespace rogue_like_multi_server
{
    public class BoardStateService: IBoardStateService
    {
        private readonly ILogger<BoardStateService> _logger;
        private readonly IMapService _mapService;

        public BoardStateService(ILogger<BoardStateService> logger, IMapService mapService)
        {
            _logger = logger;
            _mapService = mapService;
        }

        public BoardState Generate(GameConfig gameConfig)
        {
            return new BoardState(
                GenerateStatic(gameConfig),
                GenerateDynamic()
            );
        }

        public BoardStateDynamic StartGame(BoardStateDynamic boardStateDynamic)
        {
            boardStateDynamic.GameStatus = GameStatus.Play;

            // Set a random player to be the Bad guy the other ones are still good guys
            foreach (var kvp in boardStateDynamic.Players)
            {
                kvp.Value.Role = Role.Good;
            }

            Random rnd = new Random();
            var i = rnd.Next(0, boardStateDynamic.Players.Count-1);
            var players = Enumerable.ToList(boardStateDynamic.Players.Values);
            players[i].Role = Role.Bad;
            
            return boardStateDynamic;
        }

        public BoardStateDynamic Update(BoardStateDynamic boardStateDynamic, GameConfig config)
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
                boardStateDynamic.Map = _mapService.DropItems(boardStateDynamic.Map, boardStateDynamic.Entities[keyToRemove].Inventory, boardStateDynamic.Entities[keyToRemove].Coord.ToCoord());
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
                boardStateDynamic.Map = _mapService.DropItems(boardStateDynamic.Map, boardStateDynamic.Players[keyToRemove].Entity.Inventory, boardStateDynamic.Players[keyToRemove].Entity.Coord.ToCoord());
                 boardStateDynamic.Players.Remove(keyToRemove);
            }

            var nowTimestamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds();
            // Change GameState if needed
            if (boardStateDynamic.GameStatus == GameStatus.Play && nowTimestamp > boardStateDynamic.StartTimestamp + config.NbSecsPerCycle)
            {
                boardStateDynamic.StartTimestamp = nowTimestamp;
                boardStateDynamic.GameStatus = GameStatus.Discuss;
            }

            if (boardStateDynamic.GameStatus == GameStatus.Discuss && nowTimestamp > boardStateDynamic.StartTimestamp + config.NbSecsDiscuss)
            {
                var winner = ResolveVotes(boardStateDynamic);
                if (winner != null)
                {
                    // Kill the winner of the vote
                    boardStateDynamic.Map = _mapService.DropItems(boardStateDynamic.Map, boardStateDynamic.Entities[winner].Inventory, boardStateDynamic.Entities[winner].Coord.ToCoord());
                    boardStateDynamic.Entities.Remove(winner); //TODO: don't remove just mark as dead !
                }
                // Reset Night state
                boardStateDynamic.NightState = new NightState(new List<Vote>(), new List<Gift>(), new List<Gift>());

                boardStateDynamic.StartTimestamp = nowTimestamp;
                boardStateDynamic.GameStatus = GameStatus.Play;
            }

            // Clean old events (older than 10 secs)
            boardStateDynamic.Events = boardStateDynamic.Events.Where(x => x.Timestamp > (nowTimestamp -5)*1000).ToList();

            return boardStateDynamic;

            // IA Stuff
            foreach (var entity in boardStateDynamic.Entities)
            {
                // If on the fire estinguish it
                if (entity.Value.Coord == new FloatingCoord(5, 5))
                {
                    boardStateDynamic.NbBagsFound = Math.Max(boardStateDynamic.NbBagsFound - 1, 0);
                }

                // Move
                entity.Value.JpParam.Reset(entity.Value.Coord.ToGridPos(), new GridPos(5,5));
                List<GridPos> resultPathList = JumpPointFinder.FindPath(entity.Value.JpParam);
                if (resultPathList.Count > 1)
                {
                    var random3 = new Random();
                    if (random3.Next(0, 3) == 0) // 1 chance out of 3 to move
                        entity.Value.Coord = FloatingCoord.FromGridPos(resultPathList[1]);

                    break;
                }

                Random random = new Random();
                var x = random.Next(0, 100);

                Random random2 = new Random();
                var y = random2.Next(0, 100);

                _logger.Log(LogLevel.Information, $"Entity reset to {x}, {y}");
                entity.Value.Coord = new FloatingCoord(x, y);
            }

            return boardStateDynamic;
        }

        public BoardStateDynamic ApplyPlayerVelocity(BoardStateDynamic boardStateDynamic, Map map, string playerName,
            FloatingCoord velocity, double inputSequenceNumber)
        {
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to move but he doesn't exist on the server");
                return boardStateDynamic;
            }

            player.InputSequenceNumber = inputSequenceNumber;

            var coord = player.Entity.Coord + velocity;

            var gridCoord = coord.ToGridPos();
            if (!map.Cells[gridCoord.x][gridCoord.y].FloorType.IsWalkable())
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to move on {coord} but it is not walkable");
                return boardStateDynamic;
            }

            player.Entity.Coord = coord;

            // Pickup objects
            if (map.Cells[gridCoord.x][gridCoord.y].ItemType != null)
            {
                player.Entity.Inventory.Add(map.Cells[gridCoord.x][gridCoord.y].ItemType.Value);
                _mapService.PickupItem(map, Coord.FromGridPos(gridCoord));
            }

            // Drop bags at CampFire
            if (map.Cells[gridCoord.x][gridCoord.y].FloorType == FloorType.CampFire && player.Entity.Inventory.Contains(ItemType.Bag))
            {
                int nbBags = player.Entity.Inventory.RemoveAll(item => item == ItemType.Bag);
                boardStateDynamic.NbBagsFound += nbBags;
                if (boardStateDynamic.NbBagsFound >= 4)
                {
                    boardStateDynamic.WinnerTeam = Role.Good;
                }
            }

            return boardStateDynamic;
        }

        public BoardStateDynamic ApplyPlayerVote(BoardStateDynamic boardStateDynamic, string playerName, string vote, double inputSequenceNumber)
        {
            if (boardStateDynamic.GameStatus != GameStatus.Discuss)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to vote but game status is {boardStateDynamic.GameStatus}");
                return boardStateDynamic;
            }
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to vote but he doesn't exist on the server");
                return boardStateDynamic;
            }

            if (boardStateDynamic.NightState.Votes.FindIndex(x => x.From == playerName) != -1)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} has already voted");
                return boardStateDynamic;
            }

            player.InputSequenceNumber = inputSequenceNumber;

            boardStateDynamic.NightState.Votes.Add(new Vote(playerName, vote));
            return boardStateDynamic;
        }

        public BoardStateDynamic ConnectPlayer(BoardStateDynamic boardStateDynamic, string playerName)
        {
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Error, $"Player {playerName} tried to connect but he doesn't exist on this game");
                return boardStateDynamic;
            }

            player.IsConnected = true;
            return boardStateDynamic;
        }

        public BoardStateDynamic AddPlayer(BoardStateDynamic boardStateDynamic, string playerName, FloatingCoord coord)
        {
            if (boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Information, $"Player {playerName} tried to be added at {coord} but he already exist at position {player.Entity.Coord} on the server");
                player.IsConnected = true;
                return boardStateDynamic;
            }
            boardStateDynamic.Players.Add(playerName, new Player(new Entity(coord, playerName, 6, new List<ItemType>(), 3, boardStateDynamic.Map.SearchGrid), -1, true));

            return boardStateDynamic;
        }

        public List<string> GetPlayers(BoardStateDynamic boardStateDynamic)
        {
            return boardStateDynamic.Players.Keys.ToList();
          
        }

        public BoardStateDynamic RemovePlayer(BoardStateDynamic boardStateDynamic, string playerName)
        {
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to be removed but he doesn't exist on the server");
                return boardStateDynamic;
            }
            if (boardStateDynamic.GameStatus == GameStatus.Prepare)
            {
                boardStateDynamic.Players.Remove(playerName);
                return boardStateDynamic;
            }
            // We just mark it as disconnected to remember his coord and all if he reconnects
            player.IsConnected = false;

            return boardStateDynamic;
        }

        public BoardStateDynamic PlayerActionAttack(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber)
        {
            _logger.Log(LogLevel.Information, $"{playerName} attack");
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var attackingPlayer))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to attack but he doesn't exist on the server");
                return boardStateDynamic;
            }

            var nowTimestamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds();

            if (attackingPlayer.CoolDownAttack > nowTimestamp)
            {
                return boardStateDynamic;
            }

            attackingPlayer.InputSequenceNumber = inputSequenceNumber;
            attackingPlayer.CoolDownAttack = nowTimestamp + 2000;

            foreach (var entity in boardStateDynamic.Entities)
            {
                if (FloatingCoord.Distance2d(attackingPlayer.Entity.Coord, entity.Value.Coord) <= 1)
                {
                    entity.Value.Pv--;
                    boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.Attack, entity.Value.Coord, nowTimestamp));
                }
            }

            foreach (var player in boardStateDynamic.Players)
            {
                if (attackingPlayer.Entity.Name != player.Value.Entity.Name && FloatingCoord.Distance2d(attackingPlayer.Entity.Coord, player.Value.Entity.Coord) <= 1)
                {
                    player.Value.Entity.Pv--;
                    boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.Attack, player.Value.Entity.Coord, nowTimestamp));
                }
            }

            return boardStateDynamic;
        }

        private string ResolveVotes(BoardStateDynamic boardStateDynamic)
        {
            if (boardStateDynamic.NightState.Votes.Count == 0)
                return null;

            var votes = new Dictionary<string, int>();
            foreach (var vote in boardStateDynamic.NightState.Votes)
            {
                if (!votes.ContainsKey(vote.For))
                    votes.Add(vote.For, 0);
                votes[vote.For]++;
            }

            var maxVotes = votes.Values.Max();
            var keyOfMaxValue = votes.Aggregate((x, y) => x.Value > y.Value ? x : y).Key;

            if (votes.Values.Count(x => x == maxVotes) > 1)
                return null;
            if (keyOfMaxValue == "pass")
                return null;

            return keyOfMaxValue;

        }

        private BoardStateStatic GenerateStatic(GameConfig gameConfig)
        {
            return new BoardStateStatic(gameConfig);
        }

        private BoardStateDynamic GenerateDynamic()
        {
            var map = _mapService.Generate(100, 100);
            var now = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds();
            return new BoardStateDynamic(
                map,
                new Dictionary<string, Entity>()
                {
                    { "pwet", new Entity(new FloatingCoord(10, 10), "pwet", 7, new List<ItemType>()
                    {
                        ItemType.Bag
                    }, 3, map.SearchGrid) }
                },
                new Dictionary<string, Player>(),
                0,
                Role.None,
                now,
                now,
                GameStatus.Prepare,
                new List<ActionEvent>(),
                new NightState(new List<Vote>(), new List<Gift>(), new List<Gift>())
            );
        }
    }

    public interface IBoardStateService
    {
        BoardState Generate(GameConfig gameConfig);

        BoardStateDynamic StartGame(BoardStateDynamic boardStateDynamic);

        BoardStateDynamic Update(BoardStateDynamic boardStateDynamic, GameConfig gameConfig);

        BoardStateDynamic ApplyPlayerVelocity(BoardStateDynamic boardStateDynamic, Map map, string playerName,
            FloatingCoord velocity, double inputSequenceNumber);

        BoardStateDynamic ApplyPlayerVote(BoardStateDynamic boardStateDynamic, string playerName, string vote, double inputSequenceNumber);

        BoardStateDynamic ConnectPlayer(BoardStateDynamic boardStateDynamic, string playerName);

        BoardStateDynamic AddPlayer(BoardStateDynamic boardStateDynamic, string playerName, FloatingCoord coord);

        List<string> GetPlayers(BoardStateDynamic boardStateDynamic);

        BoardStateDynamic RemovePlayer(BoardStateDynamic boardStateDynamic, string playerName);

        BoardStateDynamic PlayerActionAttack(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber);
    }
}