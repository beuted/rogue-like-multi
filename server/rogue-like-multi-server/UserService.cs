using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using rogue;

namespace rogue_like_multi_server
{
    // https://jasonwatmore.com/post/2018/09/08/aspnet-core-21-basic-authentication-tutorial-with-example-api
    public interface IUserService
    {
        Task<User> Authenticate(string username, string password);
        Task<IEnumerable<User>> GetAll();
    }

    public class UserService : IUserService
    {
        public async Task<User> Authenticate(string username, string password)
        {
            // Here you should do some checks in the DB etc

            // authentication successful so return user details without password
            return new User()
            {
                Username = username,
                Password = null,
            };
        }

        public async Task<IEnumerable<User>> GetAll()
        {
            // return users without passwords
            return new List<User>();
        }
    }
}