using Newtonsoft.Json;

namespace rogue
{
    public class Player
    {
        [JsonProperty("entity")]
        public Entity Entity;

        [JsonProperty("inputSequenceNumber")]
        public double InputSequenceNumber;

        [JsonIgnore]
        public bool IsConnected;

        public Player(Entity entity, double inputSequenceNumber, bool isConnected)
        {
            Entity = entity;
            InputSequenceNumber = inputSequenceNumber;
            IsConnected = isConnected;
        }

    }
}