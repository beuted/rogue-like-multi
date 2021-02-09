using Newtonsoft.Json;
using rogue_like_multi_server;
using System.Collections.Generic;

namespace rogue
{
    public class Vote
    {
        [JsonProperty("from")]
        public string From;

        [JsonProperty("for")]
        public string For;

        public Vote(string from, string @for)
        {
            From = from;
            For = @for;
        }
    }

    public class Gift
    {
        [JsonProperty("from")]
        public string From;

        public Gift(string from)
        {
            From = from;
        }
    }

    public class NightState
    {
        [JsonProperty("votes")]
        public List<Vote> Votes;

        [JsonProperty("foodGiven")]
        public List<Gift> FoodGiven;

        [JsonProperty("materialGiven")]
        public List<Gift> MaterialGiven;

        [JsonConstructor]
        public NightState(List<Vote> votes, List<Gift> foodGiven, List<Gift> materialGiven)
        {
            Votes = votes;
            FoodGiven = foodGiven;
            MaterialGiven = materialGiven;
        }

        public NightState()
        {
            Votes = new List<Vote>();
            FoodGiven = new List<Gift>();
            MaterialGiven = new List<Gift>();
        }
    }
}