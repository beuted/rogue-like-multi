using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Logging;
using rogue;

namespace rogue_like_multi_server
{
    public class BoardStateService: IBoardStateService
    {
        private readonly ILogger<BoardStateService> _logger;
        private readonly IMapService _mapService;
        private readonly IRandomGeneratorService _randomGeneratorService;

        public BoardStateService(ILogger<BoardStateService> logger, IMapService mapService, IRandomGeneratorService randomGeneratorService)
        {
            _logger = logger;
            _mapService = mapService;
            _randomGeneratorService = randomGeneratorService;
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

            var i = _randomGeneratorService.Generate(0, boardStateDynamic.Players.Count-1);
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

                boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.VoteResult, nowTimestamp, default, winner, default));

                // Check if there is missing food and act accordingly
                var missingFood = Math.Max(0, boardStateDynamic.Players.Values.Count(x => x.Entity.Pv > 0) - boardStateDynamic.NightState.FoodGiven.Count);
                if (missingFood > 0)
                {
                    // Damage a player for each food missing
                    for (var i = 0; i < missingFood; i++)
                    {
                        var playersAlive = boardStateDynamic.Players.Values.Where(x => x.Entity.Pv > 0).ToList();
                        var rndIndex = _randomGeneratorService.Generate(0, playersAlive.Count() - 1);
                        playersAlive[rndIndex].Entity.Pv--;
                    }
                }

                // Reset Night state votes and food
                boardStateDynamic.NightState = new NightState(new List<Vote>(), new List<Gift>(), boardStateDynamic.NightState.MaterialGiven);

                boardStateDynamic.StartTimestamp = nowTimestamp;
                boardStateDynamic.GameStatus = GameStatus.Play;
            }

            // Find winner Team
            if (boardStateDynamic.GameStatus != GameStatus.Prepare) {
                // If all goods are dead the bads win the game
                /*if (!boardStateDynamic.Players.Where(x => x.Value.Role == Role.Good && x.Value.Entity.Pv > 0).Any())
                {
                    boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.EndGame, nowTimestamp*1000, default, default, Role.Bad));
                    boardStateDynamic.GameStatus = GameStatus.Prepare;
                }*/
                // Not the other other way around
            }

            // Clean old events (older than 5 secs)
            boardStateDynamic.Events = boardStateDynamic.Events.Where(x => x.Timestamp > (nowTimestamp -5)*1000).ToList();

            return boardStateDynamic;
        }

        private bool FindValidCellMove(Cell[][] cells, FloatingCoord playerCoord, FloatingCoord velocity, bool hasKey, out Coord gridCoord, out FloatingCoord coord)
        {
            coord = playerCoord + velocity;
            gridCoord = coord.ToCoord();
            if (cells[gridCoord.X][gridCoord.Y].FloorType.IsWalkable(hasKey)) return true;

            coord = playerCoord + velocity.ProjectOnX();
            gridCoord = coord.ToCoord();
            if (cells[gridCoord.X][gridCoord.Y].FloorType.IsWalkable(hasKey)) return true;

            coord = playerCoord + velocity.ProjectOnY();
            gridCoord = coord.ToCoord();
            if (cells[gridCoord.X][gridCoord.Y].FloorType.IsWalkable(hasKey)) return true;

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
            if (map.Cells[gridCoord.X][gridCoord.Y].ItemType != null && map.Cells[gridCoord.X][gridCoord.Y].ItemType != ItemType.Empty)
            {
                player.Entity.Inventory.Add(map.Cells[gridCoord.X][gridCoord.Y].ItemType.Value);
                _mapService.PickupItem(map, gridCoord);
            }

            // Remove key if on closed door
            if (map.Cells[gridCoord.X][gridCoord.Y].FloorType == FloorType.ClosedDoor && player.Entity.Inventory.Contains(ItemType.Key))
            {
                player.Entity.Inventory.Remove(ItemType.Key);
                map.Cells[gridCoord.X][gridCoord.Y].FloorType = FloorType.OpenDoor;
            }

            // Remove key if on closed chest
            if (map.Cells[gridCoord.X][gridCoord.Y].FloorType == FloorType.ClosedChest && player.Entity.Inventory.Contains(ItemType.Key))
            {
                player.Entity.Inventory.Remove(ItemType.Key);
                map.Cells[gridCoord.X][gridCoord.Y].FloorType = FloorType.Plain;
                _mapService.DropItems(boardStateDynamic.Map, new [] {ItemType.Food, ItemType.Wood}, gridCoord);
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


        public BoardStateDynamic ApplyGiveFood(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber)
        {
            if (boardStateDynamic.GameStatus != GameStatus.Discuss)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to give food but game status is {boardStateDynamic.GameStatus}");
                return boardStateDynamic;
            }
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to give food but he doesn't exist on the server");
                return boardStateDynamic;
            }
            if (!player.Entity.Inventory.Any(x => x == ItemType.Food))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to give food but he doesn't have any");
                return boardStateDynamic;
            }

            player.InputSequenceNumber = inputSequenceNumber;

            player.Entity.Inventory.Remove(ItemType.Food);
            boardStateDynamic.NightState.FoodGiven.Add(new Gift(playerName));
            return boardStateDynamic;
        }

        public BoardStateDynamic ApplyGiveMaterial(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber)
        {
            if (boardStateDynamic.GameStatus != GameStatus.Discuss)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to give material but game status is {boardStateDynamic.GameStatus}");
                return boardStateDynamic;
            }
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to give material but he doesn't exist on the server");
                return boardStateDynamic;
            }
            if (!player.Entity.Inventory.Any(x => x == ItemType.Bag))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to give material but he doesn't have any");
                return boardStateDynamic;
            }

            player.InputSequenceNumber = inputSequenceNumber;

            player.Entity.Inventory.Remove(ItemType.Bag);
            boardStateDynamic.NightState.MaterialGiven.Add(new Gift(playerName));
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
            boardStateDynamic.Players.Add(playerName, new Player(new Entity(coord, playerName, 6, new List<ItemType>(), 3), -1, true));

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
            if (!attackingPlayer.Entity.Inventory.Contains(ItemType.Sword))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to attack but he doesn't have a sword");
                return boardStateDynamic;
            }

            var nowTimestamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds();

            if (attackingPlayer.CoolDownAttack > nowTimestamp)
            {
                return boardStateDynamic;
            }

            attackingPlayer.InputSequenceNumber = inputSequenceNumber;
            attackingPlayer.CoolDownAttack = nowTimestamp + 2000;

            decimal range = 1;
            var victimFound = false;
            foreach (var entity in boardStateDynamic.Entities)
            {
                if (FloatingCoord.Distance2d(attackingPlayer.Entity.Coord, entity.Value.Coord) <= range)
                {
                    entity.Value.Pv--;
                    boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.Attack, nowTimestamp, entity.Value.Coord, default, Role.None));
                    victimFound = true;
                    break;
                }
            }

            if (!victimFound)
            {
                foreach (var player in boardStateDynamic.Players)
                {
                    if (attackingPlayer.Entity.Name != player.Value.Entity.Name && FloatingCoord.Distance2d(attackingPlayer.Entity.Coord, player.Value.Entity.Coord) <= range && player.Value.Entity.Pv > 0)
                    {
                        player.Value.Entity.Pv--;
                        boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.Attack, nowTimestamp, player.Value.Entity.Coord, null, Role.None));
                        victimFound = true;
                        break;
                    }
                }
            }

            if (victimFound)
            {
                attackingPlayer.Entity.Inventory.Remove(ItemType.Sword);
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
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, System.AppDomain.CurrentDomain.RelativeSearchPath ?? "");
            var map = _mapService.Generate(100, 100, Path.Combine(path, "dist/assets/map.json"));
            var now = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds();
            return new BoardStateDynamic(
                map,
                new Dictionary<string, Entity>()
                {
                    { "pwet", new Entity(new FloatingCoord(48, 48), "pwet", 7, new List<ItemType>()
                    {
                        ItemType.Wood
                    }, 130) }
                },
                new Dictionary<string, Player>(),
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

        BoardStateDynamic ApplyGiveFood(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber);

        BoardStateDynamic ApplyGiveMaterial(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber);

        BoardStateDynamic ConnectPlayer(BoardStateDynamic boardStateDynamic, string playerName);

        BoardStateDynamic AddPlayer(BoardStateDynamic boardStateDynamic, string playerName, FloatingCoord coord);

        List<string> GetPlayers(BoardStateDynamic boardStateDynamic);

        BoardStateDynamic RemovePlayer(BoardStateDynamic boardStateDynamic, string playerName);

        BoardStateDynamic PlayerActionAttack(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber);
    }
}