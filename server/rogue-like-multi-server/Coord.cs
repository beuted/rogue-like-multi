using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public struct Coord
    {
        [JsonProperty("x")]
        public int X;

        [JsonProperty("y")]
        public int Y;

        public Coord(int x, int y)
        {
            X = x;
            Y = y;
        }
    }
}