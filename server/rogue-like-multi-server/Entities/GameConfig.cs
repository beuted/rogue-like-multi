using Newtonsoft.Json;
using rogue_like_multi_server;
using System.Collections.Generic;

namespace rogue
{
    public class LootTable 
    {
        [JsonConverter(typeof(DictionaryWithEnumKeyConverter<ItemType, int>))]
        [JsonProperty("loot")]
        public Dictionary<ItemType, int> Loot;
    }

    public class GameConfig
    {
        [JsonProperty("nbSecsPerCycle")]
        public int NbSecsPerCycle;

        [JsonProperty("nbSecsDiscuss")]
        public int NbSecsDiscuss;

        [JsonProperty("badGuyVision")]
        public decimal BadGuyVision;

        [JsonConverter(typeof(DictionaryWithEnumKeyConverter<ItemType, int>))]
        [JsonProperty("itemSpawn")]
        public Dictionary<ItemType, int> ItemSpawn;

        [JsonConverter(typeof(DictionaryWithEnumKeyConverter<EntityType, int>))]
        [JsonProperty("entitySpawn")]
        public Dictionary<EntityType, int> EntitySpawn;

        [JsonProperty("chestLoot")]
        public LootTable ChestLoot;

        [JsonConverter(typeof(DictionaryWithEnumKeyConverter<EntityType, LootTable>))]
        [JsonProperty("entityLoot")]
        public Dictionary<EntityType, LootTable> EntityLoot;

        [JsonProperty("nbMaterialToWin")]
        public int NbMaterialToWin;

        [JsonProperty("playerSpeed")]
        public decimal PlayerSpeed;

        [JsonProperty("entitySpeed")]
        public decimal EntitySpeed;

        [JsonProperty("entityAggroDistance")]
        public int EntityAggroDistance;

        [JsonProperty("nbBadGuys")]
        public int NbBadGuys;
        
        public GameConfig(int nbSecsPerCycle, int nbSecsDiscuss, decimal badGuyVision, Dictionary<ItemType, int> itemSpawn,
            Dictionary<EntityType, int> entitySpawn, LootTable chestLoot, Dictionary<EntityType, LootTable> entityLoot,
            int nbMaterialToWin, decimal playerSpeed, decimal entitySpeed, int entityAggroDistance)
        {
            NbSecsPerCycle = nbSecsPerCycle;
            NbSecsDiscuss = nbSecsDiscuss;
            BadGuyVision = badGuyVision;
            ItemSpawn = itemSpawn;
            EntitySpawn = entitySpawn;
            ChestLoot = chestLoot;
            EntityLoot = entityLoot;
            NbMaterialToWin = nbMaterialToWin;
            PlayerSpeed = playerSpeed;
            EntitySpeed = entitySpeed;
            EntityAggroDistance = entityAggroDistance;
        }
    }
}