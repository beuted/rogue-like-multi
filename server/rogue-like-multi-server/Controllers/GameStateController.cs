﻿using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rogue;

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
        [HttpGet("{gameHash}")]
        public IActionResult GetState(string gameHash)
        {
            return Ok(_gameService.FindGame(gameHash));
        }

        [HttpPost("reset")]
        public IActionResult ResetGame([FromBody] GameConfig gameConfig)
        {
            if (_gameService.TryReset(gameConfig))
                return Ok();
            return BadRequest();
        }

        [HttpPost("create")]
        public IActionResult CreateGame([FromBody] GameConfig gameConfig)
        {
            var gameHash = _gameService.Init(gameConfig, User.Identity.Name);
            return Ok(gameHash);
        }

        [HttpPost("{gameHash}/config")]
        public IActionResult UpdateGameConfig(string gameHash, [FromBody] GameConfig gameConfig)
        {
            _gameService.UpdateGameConfig(gameConfig);
            return Ok(gameHash);
        }

        [HttpGet("{gameHash}/config")]
        public IActionResult FetchGameConfig(string gameHash)
        {
            return Ok(_gameService.GetGameConfig());
        }


        [HttpPost("{gameHash}/join")]
        public IActionResult JoinGame(string gameHash)
        {
            _gameService.AddPlayer(User.Identity.Name);
            return Ok(gameHash);
        }

        [HttpPost("{gameHash}/start")]
        public async Task<IActionResult> StartGame(string gameHash)
        {
            await _gameService.StartGame();
            return Ok();
        }

        [HttpPost("{gameHash}/user/{userName}/skin/{skinId}")]
        public IActionResult SetPlayerSkinId(string gameHash, string userName, int skinId)
        {
            _gameService.SetPlayerSkinId(userName, skinId);
            return Ok();
        }

        [HttpGet("{gameHash}/players")]
        public IActionResult GetPlayers(string gameHash)
        {
            var players = _gameService.GetPlayers();
            return Ok(players);
        }
    }
}