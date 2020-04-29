using System.Collections.Generic;
using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class MapStateDynamic
    {
        [JsonProperty("entities")]
        public Dictionary<string, Entitiy> Entities;

        MapStateDynamic(Dictionary<string, Entitiy> entities)
        {
            Entities = entities;
        }

        public static MapStateDynamic Generate()
        {
            return new MapStateDynamic(
                new Dictionary<string, Entitiy>()
                {
                    { "pwet", new Entitiy(new Coord(10, 10), "pwet", 6) }
                }
            );
        }
    }
}