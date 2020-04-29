using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class Entitiy
    {
        [JsonProperty("coord")]
        public Coord Coord;

        [JsonProperty("name")]
        public string Name;

        [JsonProperty("spriteId")]
        public int SpriteId;

        public Entitiy(Coord coord, string name, int spriteId)
        {
            Coord = coord;
            Name = name;
            SpriteId = spriteId;
        }
    }
}