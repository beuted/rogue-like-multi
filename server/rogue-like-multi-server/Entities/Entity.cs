using System.Collections.Generic;
using Newtonsoft.Json;

namespace rogue
{
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

        public Entity(FloatingCoord coord, string name, int spriteId, List<ItemType> inventory, int maxPv)
        {
            Coord = coord;
            Name = name;
            SpriteId = spriteId;
            Inventory = inventory;
            Pv = maxPv;
            MaxPv = maxPv;
        }
    }
}