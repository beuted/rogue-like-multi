using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using rogue;
using rogue_like_multi_server.Hubs;

namespace rogue_like_multi_server
{
    public class GameService: IGameService
    {
        private IBoardStateService _boardStateService;
        private IHubContext<ChatHub> _chatHubContext;
        private readonly ILogger<GameService> _logger;
        private List<Tuple<string, Input>> playerInputs = new List<Tuple<string, Input>>();

        public GameService(IBoardStateService boardStateService, ILogger<GameService> logger, IHubContext<ChatHub> chatHubContext)
        {
            _boardStateService = boardStateService;
            _logger = logger;
            _chatHubContext = chatHubContext;
        }

        public BoardState BoardState { get; private set; }

        public string Init(GameConfig gameConfig, string playerName)
        {
            if (BoardState != null)
                return null; // We don't allow to create a game if one is already running
            BoardState = _boardStateService.InitWithConfig(gameConfig); // We will generate the dynamic config when pressing "StartGame"
            AddPlayer(playerName);
            return "random-hash";
        }

        public void UpdateGameConfig(GameConfig gameConfig)
        {
            BoardState = _boardStateService.ChangeConfig(gameConfig, BoardState.BoardStateDynamic.Players);
        }

        public GameConfig GetGameConfig()
        {
            return BoardState.BoardStateStatic.GameConfig;
        }

        public BoardState FindGame(string gameHash)
        {
            if (BoardState != null)
                return BoardState;
            return null;
        }


        public async Task StartGame()
        {
            if (BoardState == null)
                return;

            // Generate the Map, Entities etc... based on the current config, but we keep the current players that have been added in the lobby
            BoardState = _boardStateService.Generate(BoardState.BoardStateStatic.GameConfig, BoardState.BoardStateDynamic.Players);

            // Distribute the roles to the players and set the game status "start"
            BoardState.BoardStateDynamic = _boardStateService.StartGame(BoardState.BoardStateDynamic);

            var players = _boardStateService.GetPlayers(BoardState.BoardStateDynamic);
            await _chatHubContext.Clients.Users(players.Keys.ToArray()).SendAsync("initBoardState", BoardState.GetClientView());
        }

        public void SetPlayerSkinId(string playerName, int skinId)
        {
            if (!BoardState.BoardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to send a message but he doesn't exist on the server");
            }
            player.Entity.SpriteId = skinId;
        }

        public async Task SendPlayerInit(string user)
        {
            var client = _chatHubContext.Clients.Users(user);
            if (client == null)
            {
                _logger.Log(LogLevel.Error, $"Could not find user {user} in hub");
                return;
            }
            if (BoardState == null)
                return;
            await client.SendAsync("initBoardState", BoardState.GetClientView());
        }

        public bool TryReset(GameConfig gameConfig)
        {
            if (BoardState.BoardStateDynamic.WinnerTeam == Role.None)
                return false;
            BoardState = _boardStateService.Generate(gameConfig, new Dictionary<string, Player>());
            return true;
        }

        public void HardReset()
        {
            BoardState = null;
        }

        public void Update(long turnElapsedMs)
        {
            if (BoardState != null && BoardState.BoardStateDynamic.GameStatus != GameStatus.Prepare && BoardState.BoardStateDynamic.GameStatus != GameStatus.Pause)
                BoardState.BoardStateDynamic = _boardStateService.Update(BoardState.BoardStateDynamic, BoardState.BoardStateStatic.GameConfig, turnElapsedMs);
        }

        public void ReceivePlayerInput(long time, string playerName, Input input)
        {
            playerInputs.Add(new Tuple<string, Input>(playerName, input));
        }

        public void ApplyPlayerInputs()
        {
            if (BoardState == null)
                return;

            while (playerInputs.Count > 0)
            {
                var playerInput = playerInputs[0];
                playerInputs.RemoveAt(0);
                if (playerInput == null)
                {
                    //TODO: This should not be needed to investigate
                    continue;
                }

                if (playerInput.Item2.Type == InputType.Move && (playerInput.Item2.Direction.Value.X != 0 || playerInput.Item2.Direction.Value.Y != 0))
                    BoardState.BoardStateDynamic = _boardStateService.ApplyPlayerVelocity(BoardState.BoardStateDynamic, BoardState.BoardStateDynamic.Map, playerInput.Item1, playerInput.Item2.PressTime.Value * playerInput.Item2.Direction.Value, playerInput.Item2.InputSequenceNumber, BoardState.BoardStateStatic.GameConfig.ChestLoot);
                else if(playerInput.Item2.Type == InputType.Attack)
                    BoardState.BoardStateDynamic = _boardStateService.PlayerActionAttack(BoardState.BoardStateDynamic, playerInput.Item1, playerInput.Item2.InputSequenceNumber, playerInput.Item2.EntityName);
                else if (playerInput.Item2.Type == InputType.Vote)
                    BoardState.BoardStateDynamic = _boardStateService.ApplyPlayerVote(BoardState.BoardStateDynamic, playerInput.Item1, playerInput.Item2.EntityName, playerInput.Item2.InputSequenceNumber);
                else if (playerInput.Item2.Type == InputType.GiveFood)
                    BoardState.BoardStateDynamic = _boardStateService.ApplyGiveFood(BoardState.BoardStateDynamic, playerInput.Item1, playerInput.Item2.InputSequenceNumber);
                else if (playerInput.Item2.Type == InputType.GiveMaterial)
                    BoardState.BoardStateDynamic = _boardStateService.ApplyGiveMaterial(BoardState.BoardStateDynamic, playerInput.Item1, playerInput.Item2.InputSequenceNumber);
                else if (playerInput.Item2.Type == InputType.UseItem && playerInput.Item2.Item.HasValue)
                    BoardState.BoardStateDynamic = _boardStateService.ApplyUseItem(BoardState.BoardStateDynamic, playerInput.Item1, playerInput.Item2.Item.Value, playerInput.Item2.InputSequenceNumber);
            }
        }

        public async Task SendPlayerMessage(string playerName, string message)
        {
            if (!BoardState.BoardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to send a message but he doesn't exist on the server");
            }
            if (player.Entity.Pv <= 0)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to send a message but he is dead");
            }
            var playersAliveInRange = BoardState.BoardStateDynamic.Players.Values.Where(p => FloatingCoord.Distance2d(p.Entity.Coord, player.Entity.Coord) <= 8 && p.Entity.Name != playerName);
            await _chatHubContext.Clients.Users(playersAliveInRange.Select(x => x.Entity.Name).ToArray()).SendAsync("newMessage", playerName, message);
        }

        public void ConnectPlayer(string playerName)
        {
            if (BoardState != null)
                BoardState.BoardStateDynamic = _boardStateService.ConnectPlayer(BoardState.BoardStateDynamic, playerName);
        }

        public void AddPlayer(string playerName)
        {
            if (BoardState == null || BoardState.BoardStateDynamic == null || BoardState.BoardStateDynamic.GameStatus != GameStatus.Prepare)
                return; // You cannot join a game that is not tsarted OR already running
            BoardState.BoardStateDynamic = _boardStateService.AddPlayer(BoardState.BoardStateDynamic, playerName, new FloatingCoord(49, 49));
        }

        public Dictionary<string, Player> GetPlayers()
        {
            if (BoardState == null)
                return new Dictionary<string, Player>();
            return _boardStateService.GetPlayers(BoardState.BoardStateDynamic);
        }

        public void RemovePlayer(string playerName)
        {
            if (BoardState == null)
                return;
            BoardState.BoardStateDynamic = _boardStateService.RemovePlayer(BoardState.BoardStateDynamic, playerName);
        }
    }

    public interface IGameService
    {
        BoardState BoardState { get; }
        string Init(GameConfig gameConfig, string playerName);
        void UpdateGameConfig(GameConfig gameConfig);
        GameConfig GetGameConfig();
        BoardState FindGame(string gameHash);
        Task StartGame();
        void SetPlayerSkinId(string userName, int skinId);
        bool TryReset(GameConfig gameConfig);
        void HardReset();
        void Update(long turnElapsedMs);
        void ReceivePlayerInput(long time, string playerName, Input input);
        void ApplyPlayerInputs();
        Task SendPlayerInit(string playerName);
        Task SendPlayerMessage(string playerName, string message);
        void ConnectPlayer(string playerName);
        void AddPlayer(string username);
        Dictionary<string, Player> GetPlayers();
        void RemovePlayer(string username);
    }
}