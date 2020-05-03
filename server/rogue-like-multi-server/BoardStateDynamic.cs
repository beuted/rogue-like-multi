using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class BoardStateDynamic
    {
        [JsonProperty("map")]
        public Map Map;

        [JsonProperty("entities")]
        public Dictionary<string, Entity> Entities;

        [JsonProperty("players")]
        public Dictionary<string, Player> Players;

        public BoardStateDynamic(Map map, Dictionary<string, Entity> entities, Dictionary<string, Player> players)
        {
            Map = map;
            Entities = entities;
            Players = players;
        }

        public BoardStateDynamic GetClientView()
        {
            var playersFiltered = Players
                .Where(kvp => kvp.Value.IsConnected)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
            return new BoardStateDynamic(Map, Entities, playersFiltered);
        }
    }
}