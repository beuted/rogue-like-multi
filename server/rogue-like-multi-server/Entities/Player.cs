using Newtonsoft.Json;

namespace rogue
{
    public class Player
    {
        [JsonProperty("entity")]
        public Entity Entity;

        [JsonProperty("inputSequenceNumber")]
        public double InputSequenceNumber;

        [JsonProperty("role")]
        public Role Role;

        [JsonIgnore]
        public bool IsConnected;

        public Player(Entity entity, double inputSequenceNumber, bool isConnected)
        {
            Entity = entity;
            InputSequenceNumber = inputSequenceNumber;
            IsConnected = isConnected;
            Role = Role.None;
        }
    }
}