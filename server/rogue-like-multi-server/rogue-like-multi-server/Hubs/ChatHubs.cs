using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SignalRChat.Hubs
{
    public class ChatHub : Hub
    {
        public async Task Move(string username, int x, int y)
        {
            await Clients.All.SendAsync("move", username, x, y);
        }
    }
}