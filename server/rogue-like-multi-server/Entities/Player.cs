using Newtonsoft.Json;

namespace rogue
{
    public class Player
    {
        [JsonProperty("entity")]
        public Entity Entity;

        [JsonProperty("inputSequenceNumber")]
        public double InputSequenceNumber;

        [JsonProperty("coolDownAttack")]
        public double CoolDownAttack;

        [JsonProperty("role")]
        public Role Role;

        [JsonIgnore]
        public bool IsConnected;

        public Player(Entity entity, double inputSequenceNumber, bool isConnected)
        {
            Entity = entity;
            InputSequenceNumber = inputSequenceNumber;
            CoolDownAttack = 0;
            IsConnected = isConnected;
            Role = Role.None;
        }

    }
}