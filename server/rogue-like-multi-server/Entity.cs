using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class Entity
    {
        [JsonProperty("coord")]
        public Coord Coord;

        [JsonProperty("name")]
        public string Name;

        [JsonProperty("spriteId")]
        public int SpriteId;

        [JsonProperty("inventory")]
        public IList<ItemType> Inventory;

        public Entity(Coord coord, string name, int spriteId, IList<ItemType> inventory)
        {
            Coord = coord;
            Name = name;
            SpriteId = spriteId;
            Inventory = inventory.ToList();
        }
    }
}