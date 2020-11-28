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

        [JsonProperty("events")]
        public List<ActionEvent> Events;

        [JsonProperty("nightState")]
        public NightState NightState;

        [JsonProperty("winnerTeam")]
        public Role WinnerTeam;

        [JsonProperty("startTimestamp")]
        public long StartTimestamp;

        [JsonProperty("nowTimestamp")]
        public long NowTimestamp;

        [JsonProperty("gameStatus")]
        public GameStatus GameStatus;

        public BoardStateDynamic(Map map, Dictionary<string, Entity> entities, Dictionary<string, Player> players, Role winnerTeam, long startTimestamp, long nowTimestamp, GameStatus gameStatus, List<ActionEvent> events, NightState nightState)
        {
            Map = map;
            Entities = entities;
            Players = players;
            WinnerTeam = winnerTeam;
            StartTimestamp = startTimestamp;
            NowTimestamp = nowTimestamp;
            GameStatus = gameStatus;
            Events = events;
            NightState = nightState;
        }

        public BoardStateDynamic GetClientView()
        {
            var playersFiltered = Players
                .Where(kvp => kvp.Value.IsConnected)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
            return new BoardStateDynamic(Map, Entities, playersFiltered, WinnerTeam, StartTimestamp, new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds(), GameStatus, Events, NightState);
        }
    }
}