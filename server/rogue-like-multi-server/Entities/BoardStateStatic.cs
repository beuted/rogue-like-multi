using Newtonsoft.Json;

namespace rogue
{
    public class BoardStateStatic
    {
        [JsonProperty("gameConfig")]
        public GameConfig GameConfig;

        public BoardStateStatic(GameConfig gameConfig)
        {
            GameConfig = gameConfig;
        }
    }
}