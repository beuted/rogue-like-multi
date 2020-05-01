using Newtonsoft.Json;

namespace rogue_like_multi_server
{
    public class BoardState
    {
        [JsonProperty("boardStateStatic")]
        public BoardStateStatic BoardStateStatic;

        [JsonProperty("boardStateDynamic")]
        public BoardStateDynamic BoardStateDynamic;

        public BoardState(BoardStateStatic boardStateStatic, BoardStateDynamic boardStateDynamic)
        {
            BoardStateStatic = boardStateStatic;
            BoardStateDynamic = boardStateDynamic;
        }
    }
}