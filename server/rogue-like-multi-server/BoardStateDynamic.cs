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

        [JsonProperty("nbBagsFound")]
        public int NbBagsFound;

        [JsonProperty("winnerTeam")]
        public Team WinnerTeam;

        public BoardStateDynamic(Map map, Dictionary<string, Entity> entities, Dictionary<string, Player> players, int nbBagsFound, Team winnerTeam)
        {
            Map = map;
            Entities = entities;
            Players = players;
            NbBagsFound = nbBagsFound;
            WinnerTeam = winnerTeam;
        }



        public BoardStateDynamic GetClientView()
        {
            var playersFiltered = Players
                .Where(kvp => kvp.Value.IsConnected)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
            return new BoardStateDynamic(Map, Entities, playersFiltered, NbBagsFound, WinnerTeam);
        }
    }
}