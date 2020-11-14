using Newtonsoft.Json;
using rogue_like_multi_server;

namespace rogue
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

        public BoardState GetClientView()
        {
            return new BoardState(BoardStateStatic, BoardStateDynamic.GetClientView());
        }
    }
}