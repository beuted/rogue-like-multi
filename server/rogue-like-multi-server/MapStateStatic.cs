using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class MapStateStatic
    {
        [JsonProperty("map")]
        public Map Map;


        MapStateStatic(Map map)
        {
            Map = map;
        }

        public static MapStateStatic Generate()
        {
            return new MapStateStatic(
                Map.Generate()
            );
        }
    }
}