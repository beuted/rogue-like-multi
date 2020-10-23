using System;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using rogue;

namespace rogue_like_multi_server.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private IGameService _gameService;
        private ILogger<ChatHub> _logger;

        public ChatHub(IGameService gameService, ILogger<ChatHub> logger)
        {
            _gameService = gameService;
            _logger = logger;
        }

        public async Task SendInput(long time, Input input)
        {
            _gameService.ReceivePlayerInput(time, Context.User.Identity.Name, input);
        }

        public async Task Talk(long time, string message)
        {
            await _gameService.SendPlayerMessage(Context.User.Identity.Name, message);
        }

        public override Task OnConnectedAsync()
        {
            _logger.Log(LogLevel.Information, $"{Context.User.Identity.Name} Has connected");
            _gameService.AddPlayer(Context.User.Identity.Name, new FloatingCoord(10, 10));
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception exception)
        {
            _logger.Log(LogLevel.Information, $"{Context.User.Identity.Name} Has disconnected");
            _gameService.RemovePlayer(Context.User.Identity.Name);
            return base.OnDisconnectedAsync(exception);
        }

    }
}