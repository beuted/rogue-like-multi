using System.Collections.Generic;
using Newtonsoft.Json;

namespace rogue
{

    public enum Aggressivity
    {
        Pacific = 0,
        Neutral = 1,
        Aggressive = 2
    }

    public class Entity
    {
        [JsonProperty("coord")]
        public FloatingCoord Coord;

        [JsonProperty("name")]
        public string Name;

        [JsonProperty("spriteId")]
        public int SpriteId;

        [JsonProperty("inventory")]
        public List<ItemType> Inventory;

        [JsonProperty("pv")]
        public int Pv;

        [JsonProperty("maxPv")]
        public int MaxPv;

        [JsonProperty("timeSinceInRange")]
        public long TimeSinceInRange; // ms

        [JsonProperty("aggressivity")]
        public Aggressivity Aggressivity;

        [JsonProperty("coolDownAttack")]
        public double CoolDownAttack;

        [JsonIgnore]
        public string TargetPlayer;


        public Entity(FloatingCoord coord, string name, int spriteId, List<ItemType> inventory, int maxPv, long timeSinceInRange, Aggressivity aggressivity)
        {
            Coord = coord;
            Name = name;
            SpriteId = spriteId;
            Inventory = inventory;
            Pv = maxPv;
            MaxPv = maxPv;
            TimeSinceInRange = timeSinceInRange;
            Aggressivity = aggressivity;
            CoolDownAttack = 0;
            TargetPlayer = null;
        }
    }
}