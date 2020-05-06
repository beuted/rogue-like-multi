using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace rogue_like_multi_server.Controllers
{
    [Authorize]
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
        public BoardState Get()
        {
            return _gameService.BoardState;
        }

        // GET api/game-state
        [HttpPost("reset")]
        public IActionResult ResetGame()
        {
            if (_gameService.TryReset())
                return Ok();
            return BadRequest();
        }
    }
}