using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using rogue_like_multi_server.Hubs;

namespace rogue_like_multi_server
{
    internal class GameHostedService : IHostedService
    {
        private readonly ILogger _logger;
        private bool _running = true;
        private IHubContext<ChatHub> _chatHubContext;
        private IGameService _gameService;
        private const long TicksPerServerTick = 300*TimeSpan.TicksPerMillisecond;
        private long _lastTrunTicks = TicksPerServerTick;

        public GameHostedService(ILogger<GameHostedService> logger, IHubContext<ChatHub> context, IGameService gameService)
        {
            _logger = logger;
            _chatHubContext = context;
            _gameService = gameService;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("GameHostedService is starting.");

            while(_running)
            {
                var begin = DateTime.UtcNow.Ticks;

                // Apply all inputs received
                _gameService.ApplyPlayerInputs();

                // Simulate world, do AI work ...
                _gameService.Update(_lastTrunTicks / TimeSpan.TicksPerMillisecond);

                // Send the updated world to clients
                await SendUpdatesClients();

                var elapsed = DateTime.UtcNow.Ticks - begin;

                // How long this turn took (taking to account delay to come)
                _lastTrunTicks = Math.Max(TicksPerServerTick, elapsed);
                if (elapsed < TicksPerServerTick)
                {
                    await Task.Delay(Convert.ToInt32((TicksPerServerTick - elapsed) / TimeSpan.TicksPerMillisecond));
                }
                else
                {
                    _logger.Log(LogLevel.Information, $"Turn is late, it took {elapsed/TimeSpan.TicksPerMillisecond} ms");
                }
            }
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Timed Background Service is stopping.");
            return Task.CompletedTask;
        }

        private async Task SendUpdatesClients()
        {
            if (_gameService.BoardState == null)
                return;
            var players = _gameService.GetPlayers();
            // Ideally we should filter events and send only events that are "in range" for each player
            await _chatHubContext.Clients.Users(players.Keys.ToArray()).SendAsync("updateBoardStateDynamic", _gameService.BoardState.BoardStateDynamic.GetLightClientView());
        }
    }
}