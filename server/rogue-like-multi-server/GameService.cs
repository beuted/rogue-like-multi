namespace rogue_like_multi_server
{
    public class GameService: IGameService
    {
        public MapState MapState { get; private set; }

        public void Init()
        {
            MapState = MapState.Generate();
        }
    }

    public interface IGameService
    {
        MapState MapState { get; }
        void Init();
    }
}