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

        public BoardStateDynamic Update(BoardStateDynamic boardStateDynamic, GameConfig config, long turnElapsedMs)
        {
            var nowTimestamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds();

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

            //IA stuff
            foreach (var entity in boardStateDynamic.Entities)
            {
                var velocity = 0.001m;
                var targetPlayer = entity.Value.TargetPlayer != null ? boardStateDynamic.Players.Values.FirstOrDefault(x => x.Entity.Name == entity.Value.TargetPlayer) : null;
                FloatingCoord? targetPlayerPosition = targetPlayer != null ? (FloatingCoord ?) targetPlayer.Entity.Coord : null;

                var direction = _mapService.FindValidMovment(boardStateDynamic.Map, entity.Value.Coord, targetPlayerPosition, velocity, Convert.ToDecimal(turnElapsedMs));
                entity.Value.Coord = entity.Value.Coord + direction;

                if (entity.Value.Aggressivity == Aggressivity.Aggressive)
                {
                    var noPlayersInRange = true;
                    foreach (var player in boardStateDynamic.Players)
                    {
                        if (FloatingCoord.Distance2d(entity.Value.Coord, player.Value.Entity.Coord) < 1)
                        {
                            noPlayersInRange = false;
                            entity.Value.TimeSinceInRange += turnElapsedMs;
                            if (entity.Value.TimeSinceInRange > 2000 && nowTimestamp > entity.Value.CoolDownAttack)
                            {
                                var victimFound = TryAttackCloseEntityOrPlayer(boardStateDynamic, entity.Value, nowTimestamp);
                                entity.Value.TimeSinceInRange = 0;
                            }
                            break;
                        }
                    }
                    if (noPlayersInRange)
                        entity.Value.TimeSinceInRange = 0;
                }
            }

            
            // Change GameState if needed
            if (boardStateDynamic.GameStatus == GameStatus.Play && nowTimestamp > boardStateDynamic.StartTimestamp + config.NbSecsPerCycle * 1000)
            {
                boardStateDynamic.StartTimestamp = nowTimestamp;
                boardStateDynamic.GameStatus = GameStatus.Discuss;
            }

            if (boardStateDynamic.GameStatus == GameStatus.Discuss
                && (nowTimestamp > boardStateDynamic.StartTimestamp + config.NbSecsDiscuss * 1000)
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
            boardStateDynamic.Events = boardStateDynamic.Events.Where(x => x.Timestamp > nowTimestamp -5000).ToList();

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
            if (map.Cells[gridCoord.X][gridCoord.Y].ItemType != null && map.Cells[gridCoord.X][gridCoord.Y].ItemType != ItemType.Empty && map.Cells[gridCoord.X][gridCoord.Y].ItemType != ItemType.Blood)
            {
                // 6 items max 9 with backpack
                if (player.Entity.Inventory.Count <= 5 || (player.Entity.Inventory.Contains(ItemType.Backpack) && player.Entity.Inventory.Count <= 9))
                {
                    player.Entity.Inventory.Add(map.Cells[gridCoord.X][gridCoord.Y].ItemType.Value);
                    _mapService.PickupItem(map, gridCoord);
                }
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

        public BoardStateDynamic ApplyUseItem(BoardStateDynamic boardStateDynamic, string playerName, ItemType item, double inputSequenceNumber)
        {
            var nowTimestamp = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds();

            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to use item but he doesn't exist on the server");
                return boardStateDynamic;
            }
            if (!player.Entity.Inventory.Any(x => x == item))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to give item {item} but he doesn't have any");
                return boardStateDynamic;
            }

            player.InputSequenceNumber = inputSequenceNumber;

            
            if (item == ItemType.HealthPotion)
            {
                player.Entity.Inventory.Remove(item);
                player.Entity.Pv = Math.Min(player.Entity.Pv + 1, player.Entity.MaxPv);
                boardStateDynamic.Events.Add(new ActionEvent(ActionEventType.Heal, nowTimestamp, player.Entity.Coord, default, Role.None));
            }
            else
            {
                player.Entity.Inventory.Remove(item);
                _mapService.DropItems(boardStateDynamic.Map, new[] { item }, player.Entity.Coord.ToCoord(), true);
            }


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
            boardStateDynamic.Players.Add(playerName, new Player(new Entity(coord, playerName, 4, new List<ItemType>(), 3, 0, Aggressivity.Neutral), -1, true));

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

            if (attackingPlayer.Entity.CoolDownAttack > nowTimestamp)
            {
                return boardStateDynamic;
            }

            attackingPlayer.InputSequenceNumber = inputSequenceNumber;

            var victimFound = TryAttackCloseEntityOrPlayer(boardStateDynamic, attackingPlayer.Entity, nowTimestamp);

            if (victimFound)
            {
                attackingPlayer.Entity.Inventory.Remove(ItemType.Sword);
            }

            return boardStateDynamic;
        }

        private ActionEvent HandleAttackOnEntity(Entity entity, Map map, long nowTimestamp, string attackerName)
        {
            ActionEvent evt;
            if (entity.Inventory.Contains(ItemType.Armor))
            {
                entity.Inventory.Remove(ItemType.Armor);
                evt = new ActionEvent(ActionEventType.ShieldBreak, nowTimestamp, entity.Coord, default, Role.None);
            }
            else
            {
                entity.Pv--;
                _mapService.DropItems(map, new[] { ItemType.Blood }, entity.Coord.ToCoord());
                evt = new ActionEvent(ActionEventType.Attack, nowTimestamp, entity.Coord, null, Role.None);
            }

            if (entity.Aggressivity == Aggressivity.Neutral || entity.Aggressivity == Aggressivity.Aggressive)
            {
                entity.Aggressivity = Aggressivity.Aggressive;
                entity.TargetPlayer = attackerName;
            }

            return evt;
        }

        private bool TryAttackCloseEntityOrPlayer(BoardStateDynamic boardStateDynamic, Entity attackingEntity, long nowTimestamp)
        {
            decimal range = 1;
            var victimFound = false;
            foreach (var entity in boardStateDynamic.Entities)
            {
                if (attackingEntity.Name != entity.Value.Name && FloatingCoord.Distance2d(attackingEntity.Coord, entity.Value.Coord) <= range)
                {
                    var evt = HandleAttackOnEntity(entity.Value, boardStateDynamic.Map, nowTimestamp, attackingEntity.Name);
                    boardStateDynamic.Events.Add(evt);
                    attackingEntity.CoolDownAttack = nowTimestamp + 2000;

                    // Victim retiliate if not pacific
                    if (nowTimestamp > entity.Value.CoolDownAttack && entity.Value.Aggressivity != Aggressivity.Pacific)
                    {
                        TryAttackCloseEntityOrPlayer(boardStateDynamic, entity.Value, nowTimestamp);
                    }

                    victimFound = true;
                    break;
                }
            }

            if (!victimFound)
            {
                foreach (var player in boardStateDynamic.Players)
                {
                    if (attackingEntity.Name != player.Value.Entity.Name && FloatingCoord.Distance2d(attackingEntity.Coord, player.Value.Entity.Coord) <= range && player.Value.Entity.Pv > 0)
                    {
                        var evt = HandleAttackOnEntity(player.Value.Entity, boardStateDynamic.Map, nowTimestamp, attackingEntity.Name);
                        boardStateDynamic.Events.Add(evt);
                        attackingEntity.CoolDownAttack = nowTimestamp + 2000;

                        // Victim retiliate. Since it's a player he can only do if he has a sword
                        if (nowTimestamp > player.Value.Entity.CoolDownAttack && player.Value.Entity.Inventory.Contains(ItemType.Sword))
                        {
                            TryAttackCloseEntityOrPlayer(boardStateDynamic, player.Value.Entity, nowTimestamp);
                        }

                        victimFound = true;
                        break;
                    }
                }
            }
            return victimFound;
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
            var now = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds();
            return new BoardStateDynamic(
                map,
                new Dictionary<string, Entity>()
                {
                    { "snake", new Entity(new FloatingCoord(30, 30), "snake", 14, new List<ItemType>()
                    {
                        ItemType.Wood, ItemType.Wood, ItemType.HealthPotion
                    }, 3, 0, Aggressivity.Aggressive) },
                    { "rat", new Entity(new FloatingCoord(56, 56), "rat", 16, new List<ItemType>()
                    {
                        ItemType.Wood
                    }, 2, 0, Aggressivity.Neutral) },
                    { "dog", new Entity(new FloatingCoord(48, 48), "dog", 15, new List<ItemType>()
                    {
                        ItemType.Wood, ItemType.Armor
                    }, 2, 0, Aggressivity.Pacific) }
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

        BoardStateDynamic Update(BoardStateDynamic boardStateDynamic, GameConfig gameConfig, long turnElapsedMs);

        BoardStateDynamic ApplyPlayerVelocity(BoardStateDynamic boardStateDynamic, Map map, string playerName,
            FloatingCoord velocity, double inputSequenceNumber);

        BoardStateDynamic ApplyPlayerVote(BoardStateDynamic boardStateDynamic, string playerName, string vote, double inputSequenceNumber);

        BoardStateDynamic ApplyGiveFood(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber);

        BoardStateDynamic ApplyGiveMaterial(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber);

        BoardStateDynamic ApplyUseItem(BoardStateDynamic boardStateDynamic, string playerName, ItemType item, double inputSequenceNumber);
        
        BoardStateDynamic ConnectPlayer(BoardStateDynamic boardStateDynamic, string playerName);

        BoardStateDynamic AddPlayer(BoardStateDynamic boardStateDynamic, string playerName, FloatingCoord coord);

        List<string> GetPlayers(BoardStateDynamic boardStateDynamic);

        BoardStateDynamic RemovePlayer(BoardStateDynamic boardStateDynamic, string playerName);

        BoardStateDynamic PlayerActionAttack(BoardStateDynamic boardStateDynamic, string playerName, double inputSequenceNumber);
    }
}