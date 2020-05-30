using System.Collections.Generic;
using EpPathFinding.cs;
using Newtonsoft.Json;
using rogue_like_multi_server;

namespace rogue
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
        public List<ItemType> Inventory;

        [JsonProperty("pv")]
        public int Pv;

        [JsonProperty("maxPv")]
        public int MaxPv;

        [JsonIgnore]
        public JumpPointParam JpParam;

        public Entity(Coord coord, string name, int spriteId, List<ItemType> inventory, int maxPv, BaseGrid searchGrid)
        {
            Coord = coord;
            Name = name;
            SpriteId = spriteId;
            Inventory = inventory;
            Pv = maxPv;
            MaxPv = maxPv;
            JpParam = new JumpPointParam(searchGrid, EndNodeUnWalkableTreatment.ALLOW, DiagonalMovement.Never);
        }

    }
}