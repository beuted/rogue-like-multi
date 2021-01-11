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
        // users hardcoded for simplicity, store in a db with hashed passwords in production applications
        private List<User> _users = new List<User>
        {
            new User { Username = "dekajoo", Password = "toto" },
            new User { Username = "oojaked", Password = "toto" },
            new User { Username = "toto", Password = "toto" },
            new User { Username = "tutu", Password = "toto" },
        };

        public async Task<User> Authenticate(string username, string password)
        {
            var user = _users.SingleOrDefault(x => x.Username == username && x.Password == password);

            // return null if user not found
            if (user == null)
                return null;

            // authentication successful so return user details without password
            return new User()
            {
                Username = user.Username,
                Password = null,
            };
        }

        public async Task<IEnumerable<User>> GetAll()
        {
            // return users without passwords
            return await Task.Run(() => _users.Select(x => {
                x.Password = null;
                return x;
            }));
        }
    }
}