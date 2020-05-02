using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using rogue_like_multi_server.Hubs;

namespace rogue_like_multi_server
{
    public class GameService: IGameService
    {
        private IBoardStateService _boardStateService;
        private IHubContext<ChatHub> _chatHubContext;
        private readonly ILogger<GameService> _logger;

        public GameService(IBoardStateService boardStateService, ILogger<GameService> logger, IHubContext<ChatHub> chatHubContext)
        {
            _boardStateService = boardStateService;
            _logger = logger;
            _chatHubContext = chatHubContext;
        }

        public BoardState BoardState { get; private set; }

        public void Init()
        {
            BoardState = _boardStateService.Generate();
        }

        public void Update()
        {
            BoardState.BoardStateDynamic = _boardStateService.Update(BoardState.BoardStateDynamic);
        }

        public void SetPlayerPosition(string playerName, Coord coord)
        {
            BoardState.BoardStateDynamic = _boardStateService.SetPlayerPosition(BoardState.BoardStateDynamic, playerName, coord);
        }

        public async Task SendPlayerMessage(string playerName, string message)
        {
            if (!BoardState.BoardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to move but he doesn't exist on the server");
            }
            var playersInRange = BoardState.BoardStateDynamic.Players.Values.Where(p => Coord.Distance(p.Entity.Coord, player.Entity.Coord) < 10 && p.Entity.Name != playerName);
            await _chatHubContext.Clients.Users(playersInRange.Select(x => x.Entity.Name).ToArray()).SendAsync("newMessage", playerName, message);
        }

        public void AddPlayer(string playerName, Coord coord)
        {
            BoardState.BoardStateDynamic = _boardStateService.AddPlayer(BoardState.BoardStateDynamic, playerName, coord);
        }

        public void RemovePlayer(string playerName)
        {
            BoardState.BoardStateDynamic = _boardStateService.RemovePlayer(BoardState.BoardStateDynamic, playerName);
        }
    }

    public interface IGameService
    {
        BoardState BoardState { get; }

        void Init();

        void Update();

        void SetPlayerPosition(string playerName, Coord coord);

        Task SendPlayerMessage(string playerName, string message);

        void AddPlayer(string username, Coord coord);

        void RemovePlayer(string username);
    }
}