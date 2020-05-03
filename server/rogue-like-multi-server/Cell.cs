using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public struct Cell
    {
        [JsonProperty("floorType")]
        public FloorType FloorType;

        [JsonProperty("itemType")]
        public ItemType? ItemType;

        public Cell(FloorType floorType, ItemType? itemType)
        {
            FloorType = floorType;
            ItemType = itemType;
        }
    }
}