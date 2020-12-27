using Newtonsoft.Json;

namespace rogue
{
    public class ActionEvent
    {
        [JsonProperty("type")]
        public ActionEventType Type;

        [JsonProperty("coord")]
        public FloatingCoord Coord;

        [JsonProperty("playerName")]
        public string PlayerName;

        [JsonProperty("timestamp")]
        public long Timestamp;

        public ActionEvent(ActionEventType type, FloatingCoord coord, string playerName, long timestamp)
        {
            Type = type;
            Coord = coord;
            PlayerName = playerName;
            Timestamp = timestamp;
        }
    }
}
