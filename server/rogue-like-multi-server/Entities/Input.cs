using Newtonsoft.Json;
using rogue;

namespace rogue_like_multi_server.Hubs
{
    public class Input
    {
        [JsonProperty("direction")]
        public Coord Direction;

        [JsonProperty("attack")]
        public bool Attack;

        [JsonProperty("pressTime")]
        public decimal PressTime;

        [JsonProperty("inputSequenceNumber")]
        public long InputSequenceNumber;
    }
}