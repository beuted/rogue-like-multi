using Newtonsoft.Json;
using rogue_like_multi_server;
using System.Collections.Generic;

namespace rogue
{
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

        [JsonConverter(typeof(DictionaryWithEnumKeyConverter<EntityType, int>))]
        [JsonProperty("chestLoot")]
        public Dictionary<ItemType, int> ChestLoot;

        [JsonConverter(typeof(DictionaryWithEnumKeyConverter<EntityType, Dictionary<ItemType, int>>))]
        [JsonProperty("entityLoot")]
        public Dictionary<EntityType, Dictionary<ItemType, int>> EntityLoot;

        [JsonProperty("nbMaterialToWin")]
        public int NbMaterialToWin;

        [JsonProperty("playerSpeed")]
        public decimal PlayerSpeed;

        [JsonProperty("entitySpeed")]
        public decimal EntitySpeed;

        [JsonProperty("entityAggroDistance")]
        public int EntityAggroDistance;

        public GameConfig(int nbSecsPerCycle, int nbSecsDiscuss, decimal badGuyVision, Dictionary<ItemType, int> itemSpawn,
            Dictionary<EntityType, int> entitySpawn, Dictionary<ItemType, int> chestLoot, Dictionary<EntityType, Dictionary<ItemType, int>> entityLoot,
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