using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace rogue_like_multi_server.Controllers
{
    [Route("api/game-state")]
    [ApiController]
    public class GameStateController : ControllerBase
    {
        private readonly IGameService _gameService;

        public GameStateController(IGameService gameService)
        {
            _gameService = gameService;
        }

        // GET api/game-state
        [HttpGet]
        public MapState Get()
        {
            return _gameService.MapState;
        }
    }
}