using Microsoft.AspNetCore.SignalR;

namespace rogue_like_multi_server
{
    public class UserIdProvider: IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            return connection.User.Identity.Name;
        }
    }
}