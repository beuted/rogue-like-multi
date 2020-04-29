using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class MapState
    {
        [JsonProperty("mapStateStatic")]
        public MapStateStatic MapStateStatic;

        [JsonProperty("mapStateDynamic")]
        public MapStateDynamic MapStateDynamic;

        MapState(MapStateStatic mapStateStatic, MapStateDynamic mapStateDynamic)
        {
            MapStateStatic = mapStateStatic;
            MapStateDynamic = mapStateDynamic;
        }

        public static MapState Generate()
        {
            return new MapState(
                MapStateStatic.Generate(),
                MapStateDynamic.Generate()
            );
        }
    }
}