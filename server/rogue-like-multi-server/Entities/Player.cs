using Newtonsoft.Json;

namespace rogue
{
    public class Player
    {
        [JsonProperty("entity")]
        public Entity Entity;

        [JsonProperty("lastAction")]
        public long? LastAction;

        [JsonIgnore]
        public bool IsConnected;

        public Player(Entity entity, long? lastAction, bool isConnected)
        {
            Entity = entity;
            LastAction = lastAction;
            IsConnected = isConnected;
        }

    }
}