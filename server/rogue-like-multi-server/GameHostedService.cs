using System;
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

        public GameHostedService(ILogger<GameHostedService> logger, IHubContext<ChatHub> context, IGameService gameService)
        {
            _logger = logger;
            _chatHubContext = context;
            _gameService = gameService;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("GameHostedService is starting.");

            _gameService.Init();

            while(_running)
            {
                var begin= DateTime.UtcNow.Ticks;

                // Apply all inputs received
                _gameService.ApplyPlayerInputs();

                // Simulate world, do AI work ...
                _gameService.Update();

                // Send the updated world to clients
                await SendUpdatesClients();

                var elapsed = DateTime.UtcNow.Ticks - begin;
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

        private void DoWork(object state)
        {
            _logger.LogInformation("Timed Background Service is working.");
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Timed Background Service is stopping.");
            return Task.CompletedTask;
        }

        private async Task SendUpdatesClients()
        {
            await _chatHubContext.Clients.All.SendAsync("setBoardStateDynamic", _gameService.BoardState.BoardStateDynamic.GetClientView());
        }
    }
}