using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class BoardStateStatic
    {
        [JsonProperty("map")]
        public Map Map;

        public BoardStateStatic(Map map)
        {
            Map = map;
        }
    }
}