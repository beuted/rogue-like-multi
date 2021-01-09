using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using rogue;

// https://jasonwatmore.com/post/2018/09/08/aspnet-core-21-basic-authentication-tutorial-with-example-api
namespace rogue_like_multi_server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly IGameService _gameService;

        public AdminController(IGameService gameService)
        {
            _gameService = gameService;
        }

        [AllowAnonymous]
        [HttpGet("hard-reset-game")]
        public IActionResult HardResetGame()
        {
            _gameService.HardReset();
            return Ok();
        }

        [AllowAnonymous]
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            return Ok("Feeling pretty.");
        }
    }
}