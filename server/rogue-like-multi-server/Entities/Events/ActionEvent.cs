using Newtonsoft.Json;
using System;

namespace rogue
{
    public class ActionEvent
    {
        [JsonProperty("type")]
        public ActionEventType Type;

        [JsonProperty("timestamp")]
        public long Timestamp;

        [JsonProperty("guid")]
        public Guid Guid;

        [JsonProperty("coord")]
        public FloatingCoord Coord;

        [JsonProperty("playerName")]
        public string PlayerName;

        [JsonProperty("winnerTeam")]
        public Role WinnerTeam;

        public ActionEvent(ActionEventType type, long timestamp, FloatingCoord coord, string playerName, Role winnerTeam)
        {
            Type = type;
            Timestamp = timestamp;
            Coord = coord;
            PlayerName = playerName;
            WinnerTeam = winnerTeam;
            Guid = Guid.NewGuid();
        }
    }
}
