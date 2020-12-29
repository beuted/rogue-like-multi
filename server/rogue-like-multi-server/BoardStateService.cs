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
            var players = boardStateDynamic.Players.Values.ToList();
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

            // Kill players with 0 pv (drop its items)
            foreach (var player in boardStateDynamic.Players)
            {
                if (player.Value.Entity.Pv <= 0 && player.Value.Entity.Inventory.Count > 0)
                {
                    boardStateDynamic.Map = _mapService.DropItems(boardStateDynamic.Map, player.Value.Entity.Inventory, player.Value.Entity.Coord.ToCoord());
                    player.Value.Entity.Inventory.RemoveAll(x => true);
                }
            }


            var nowTimestamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds();
            // Change GameState if needed
            if (boardStateDynamic.GameStatus == GameStatus.Play && nowTimestamp > boardStateDynamic.StartTimestamp + config.NbSecsPerCycle)
            {
                boardStateDynamic.StartTimestamp = nowTimestamp;
                boardStateDynamic.GameStatus = GameStatus.Discuss;
            }

            if (boardStateDynamic.GameStatus == GameStatus.Discuss
                && (nowTimestamp > boardStateDynamic.StartTimestamp + config.NbSecsDiscuss)
                || DidEverybodyVoted(boardStateDynamic))
            {
                var winner = ResolveVotes(boardStateDynamic);
                if (winner != null)
                {
                    // Kill the winner of the vote
                    boardStateDynamic.Players[winner].Entity.Pv = 0;
                }

                boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.VoteResult, default, winner, nowTimestamp));

                // Reset Night state
                boardStateDynamic.NightState = new NightState(new List<Vote>(), new List<Gift>(), new List<Gift>());

                boardStateDynamic.StartTimestamp = nowTimestamp;
                boardStateDynamic.GameStatus = GameStatus.Play;
            }

            // Clean old events (older than 5 secs)
            boardStateDynamic.Events = boardStateDynamic.Events.Where(x => x.Timestamp > (nowTimestamp -5*1000)).ToList();

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

        private bool FindValidCellMove(Cell[][] cells, FloatingCoord playerCoord, FloatingCoord velocity, bool hasKey, out GridPos gridCoord, out FloatingCoord coord)
        {
            coord = playerCoord + velocity;
            gridCoord = coord.ToGridPos();
            if (cells[gridCoord.x][gridCoord.y].FloorType.IsWalkable(hasKey)) return true;

            coord = playerCoord + velocity.ProjectOnX();
            gridCoord = coord.ToGridPos();
            if (cells[gridCoord.x][gridCoord.y].FloorType.IsWalkable(hasKey)) return true;

            coord = playerCoord + velocity.ProjectOnY();
            gridCoord = coord.ToGridPos();
            if (cells[gridCoord.x][gridCoord.y].FloorType.IsWalkable(hasKey)) return true;

            return false;
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

            var hasKey = player.Entity.Inventory.IndexOf(ItemType.Key) != -1;
            if (!FindValidCellMove(map.Cells, player.Entity.Coord, velocity, hasKey, out var gridCoord, out var coord)) {
                _logger.Log(LogLevel.Warning,
                    $"Player {playerName} tried to move on {coord} but it is not walkable");
                return boardStateDynamic;
            }

            player.Entity.Coord = coord;

            // The rest of the method is not for dead players
            if (player.Entity.Pv <= 0)
                return boardStateDynamic;

            // Pickup objects
            if (map.Cells[gridCoord.x][gridCoord.y].ItemType != null && map.Cells[gridCoord.x][gridCoord.y].ItemType != ItemType.Empty)
            {
                player.Entity.Inventory.Add(map.Cells[gridCoord.x][gridCoord.y].ItemType.Value);
                _mapService.PickupItem(map, Coord.FromGridPos(gridCoord));
            }

            // Remove key if on closed door
            if (map.Cells[gridCoord.x][gridCoord.y].FloorType == FloorType.ClosedDoor && player.Entity.Inventory.Contains(ItemType.Key))
            {
                player.Entity.Inventory.Remove(ItemType.Key);
                map.Cells[gridCoord.x][gridCoord.y].FloorType = FloorType.OpenDoor;
            }

            // Remove key if on closed chest
            if (map.Cells[gridCoord.x][gridCoord.y].FloorType == FloorType.ClosedChest && player.Entity.Inventory.Contains(ItemType.Key))
            {
                player.Entity.Inventory.Remove(ItemType.Key);
                map.Cells[gridCoord.x][gridCoord.y].FloorType = FloorType.Plain;
                _mapService.DropItems(boardStateDynamic.Map, new [] {ItemType.Food, ItemType.Wood}, Coord.FromGridPos(gridCoord));
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
            if (player.Entity.Pv <= 0)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to vote but he is dead");
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
            if (attackingPlayer.Entity.Pv <= 0)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to attack but he is dead");
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
                    boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.Attack, entity.Value.Coord, null, nowTimestamp));
                }
            }

            foreach (var player in boardStateDynamic.Players)
            {
                if (attackingPlayer.Entity.Name != player.Value.Entity.Name && FloatingCoord.Distance2d(attackingPlayer.Entity.Coord, player.Value.Entity.Coord) <= 1)
                {
                    player.Value.Entity.Pv--;
                    boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.Attack, player.Value.Entity.Coord, null, nowTimestamp));
                }
            }

            return boardStateDynamic;
        }

        private bool DidEverybodyVoted(BoardStateDynamic boardStateDynamic)
        {
            return boardStateDynamic.NightState.Votes.Count >= boardStateDynamic.Players.Count;
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
            var map = _mapService.Generate(100, 100, "../../client/src/assets/map.json");
            var now = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds();
            return new BoardStateDynamic(
                map,
                new Dictionary<string, Entity>()
                {
                    { "pwet", new Entity(new FloatingCoord(10, 10), "pwet", 7, new List<ItemType>()
                    {
                        ItemType.Wood
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