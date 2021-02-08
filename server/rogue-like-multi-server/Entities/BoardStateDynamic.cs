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

        public BoardStateDynamic GetClientView() // Used init of the model
        {
            var playersFiltered = Players
                .Where(kvp => kvp.Value.IsConnected)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
            return new BoardStateDynamic(Map, Entities, Players, WinnerTeam, StartTimestamp, new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds(), GameStatus, Events, NightState);
        }

        //TODO: Should be different object maybe
        public BoardStateDynamic GetLightClientView() // Used for Updates of the model
        {
            var playersFiltered = Players
                .Where(kvp => kvp.Value.IsConnected)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
            return new BoardStateDynamic(new Map(Map.Items, Map.ChangingFloor), Entities, Players, WinnerTeam, StartTimestamp, new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds(), GameStatus, Events, NightState);
        }
    }
}