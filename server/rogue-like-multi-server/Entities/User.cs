using Newtonsoft.Json;

namespace rogue
{
    // https://jasonwatmore.com/post/2018/09/08/aspnet-core-21-basic-authentication-tutorial-with-example-api
    public class User
    {
        [JsonProperty("username")]
        public string Username { get; set; }

        [JsonProperty("password")]
        public string Password { get; set; }
    }
}