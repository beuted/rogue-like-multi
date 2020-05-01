using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class BoardStateDynamic
    {
        [JsonProperty("entities")]
        public Dictionary<string, Entity> Entities;

        [JsonProperty("players")]
        public Dictionary<string, Player> Players;

        public BoardStateDynamic(Dictionary<string, Entity> entities, Dictionary<string, Player> players)
        {
            Entities = entities;
            Players = players;
        }
    }
}