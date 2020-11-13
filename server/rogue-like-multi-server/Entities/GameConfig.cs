using Newtonsoft.Json;

namespace rogue
{
    public class GameConfig
    {
        [JsonProperty("nbSecsPerCycle")]
        public int NbSecsPerCycle;

        [JsonProperty("nbSecsDiscuss")]
        public int NbSecsDiscuss;

        

        public GameConfig(int nbSecsPerCycle, int nbSecsDiscuss)
        {
            NbSecsPerCycle = nbSecsPerCycle;
            NbSecsDiscuss = nbSecsDiscuss;
        }
    }
}