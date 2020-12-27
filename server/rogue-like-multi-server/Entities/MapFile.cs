using Newtonsoft.Json;

namespace rogue
{
    public class MapLayer
    {
        [JsonProperty("data")]
        public int[] Data;

        [JsonProperty("name")]
        public string Name;
    }

    public class MapFile
    {
        [JsonProperty("height")]
        public int Height;

        [JsonProperty("width")]
        public int Width;

        [JsonProperty("layers")]
        public MapLayer[] Layers;
    }
}