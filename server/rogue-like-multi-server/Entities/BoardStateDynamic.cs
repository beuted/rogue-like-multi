using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using rogue_like_multi_server;

namespace rogue
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

        [JsonProperty("startTimestamp")]
        public long StartTimestamp;

        [JsonProperty("nowTimestamp")]
        public long NowTimestamp;

        [JsonProperty("gameStatus")]
        public GameStatus GameStatus;

        [JsonProperty("gameConfig")]
        public GameConfig GameConfig;

        public BoardStateDynamic(Map map, Dictionary<string, Entity> entities, Dictionary<string, Player> players, int nbBagsFound, Team winnerTeam, long startTimestamp, long nowTimestamp, GameStatus gameStatus, GameConfig gameConfig)
        {
            Map = map;
            Entities = entities;
            Players = players;
            NbBagsFound = nbBagsFound;
            WinnerTeam = winnerTeam;
            StartTimestamp = startTimestamp;
            NowTimestamp = nowTimestamp;
            GameStatus = gameStatus;
            GameConfig = gameConfig;
        }

        public BoardStateDynamic GetClientView()
        {
            var playersFiltered = Players
                .Where(kvp => kvp.Value.IsConnected)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
            return new BoardStateDynamic(Map, Entities, playersFiltered, NbBagsFound, WinnerTeam, StartTimestamp, new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds(), GameStatus, GameConfig);
        }
    }
}