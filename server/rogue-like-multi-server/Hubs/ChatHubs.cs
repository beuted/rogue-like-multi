using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace rogue_like_multi_server.Hubs
{
    public class ChatHub : Hub
    {
        public async Task Move(string username, int x, int y)
        {
            await Clients.All.SendAsync("move", username, x, y);
        }
    }
}