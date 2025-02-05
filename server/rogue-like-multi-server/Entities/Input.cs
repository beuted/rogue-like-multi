using Newtonsoft.Json;
using rogue;

namespace rogue_like_multi_server.Hubs
{
    public enum InputType
    {
        Move = 0,
        Attack = 1,
        Vote = 2,
        GiveFood = 3,
        GiveMaterial = 4,
        UseItem = 5,
        Dash = 6,
        Flash = 7
    }

    public class Input
    {
        [JsonProperty("type")]
        public InputType? Type;

        [JsonProperty("direction")]
        public FloatingCoord? Direction;

        [JsonProperty("item")]
        public ItemType? Item;

        [JsonProperty("pressTime")]
        public decimal? PressTime;

        [JsonProperty("inputSequenceNumber")]
        public long InputSequenceNumber;

        [JsonProperty("entityName")]
        public string EntityName;
    }
}