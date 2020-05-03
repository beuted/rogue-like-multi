using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class Player
    {
        [JsonProperty("entity")]
        public Entity Entity;

        [JsonIgnore]
        public bool HasPlayedThisTurn;

        [JsonIgnore]
        public bool IsConnected;

        public Player(Entity entity, bool hasPlayedThisTurn, bool isConnected)
        {
            Entity = entity;
            HasPlayedThisTurn = hasPlayedThisTurn;
            IsConnected = isConnected;
        }
    }
}