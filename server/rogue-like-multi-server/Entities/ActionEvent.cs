using Newtonsoft.Json;

namespace rogue
{
    public class ActionEvent
    {
        [JsonProperty("type")]
        public ActionEventType Type;

        [JsonProperty("coord")]
        public FloatingCoord Coord;

        [JsonProperty("timestamp")]
        public long Timestamp;

        public ActionEvent(ActionEventType type, FloatingCoord coord, long timestamp)
        {
            Type = type;
            Coord = coord;
            Timestamp = timestamp;
        }
    }
}
