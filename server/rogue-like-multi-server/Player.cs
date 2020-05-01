using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class Player
    {
        [JsonProperty("entity")]
        public Entity Entity;

        [JsonIgnore]
        public bool HasPlayedThisTurn;

        public Player(Entity entity, bool hasPlayedThisTurn)
        {
            Entity = entity;
            HasPlayedThisTurn = hasPlayedThisTurn;
        }
    }
}