using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public struct Cell
    {
        [JsonProperty("floorType")]
        public FloorType FloorType;

        public Cell(FloorType floorType)
        {
            FloorType = floorType;
        }
    }
}