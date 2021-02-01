using Newtonsoft.Json;
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

        [JsonProperty("itemSpawn")]
        public Dictionary<ItemType, int> ItemSpawn;

        [JsonProperty("entitySpawn")]
        public Dictionary<EntityType, int> EntitySpawn;

        [JsonProperty("nbMaterialToWin")]
        public int NbMaterialToWin;

        [JsonProperty("playerSpeed")]
        public decimal PlayerSpeed;

        [JsonProperty("entitySpeed")]
        public decimal EntitySpeed;


        public GameConfig(int nbSecsPerCycle, int nbSecsDiscuss, decimal badGuyVision, Dictionary<ItemType, int> itemSpawn, Dictionary<EntityType, int> entitySpawn, int nbMaterialToWin, decimal playerSpeed, decimal entitySpeed)
        {
            NbSecsPerCycle = nbSecsPerCycle;
            NbSecsDiscuss = nbSecsDiscuss;
            BadGuyVision = badGuyVision;
            ItemSpawn = itemSpawn;
            EntitySpawn = entitySpawn;
            NbMaterialToWin = nbMaterialToWin;
            PlayerSpeed = playerSpeed;
            EntitySpeed = entitySpeed;
        }
    }
}