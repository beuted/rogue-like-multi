using System.Threading.Tasks;
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
        [HttpGet]
        public BoardState Get()
        {
            return _gameService.BoardState;
        }

        [HttpPost("reset")]
        public IActionResult ResetGame([FromBody] GameConfig gameConfig)
        {
            if (_gameService.TryReset(gameConfig))
                return Ok();
            return BadRequest();
        }

        [AllowAnonymous]
        [HttpGet("hard-reset")]
        public IActionResult HardResetGame()
        {
            _gameService.HardReset();
            return Ok();
        }

        [HttpPost("create")]
        public IActionResult CreateGame([FromBody] GameConfig gameConfig)
        {
            var gameHash = _gameService.Init(gameConfig, User.Identity.Name);
            return Ok(gameHash);
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

        [HttpGet("{gameHash}/players")]
        public IActionResult GetPlayers(string gameHash)
        {
            var players = _gameService.GetPlayers();
            return Ok(players);
        }
    }
}