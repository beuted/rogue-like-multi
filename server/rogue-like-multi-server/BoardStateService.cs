using System;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;

namespace rogue_like_multi_server
{
    public class BoardStateService: IBoardStateService
    {
        private readonly ILogger<BoardStateService> _logger;

        public BoardStateService(ILogger<BoardStateService> logger)
        {
            _logger = logger;
        }

        public BoardState Generate()
        {
            return new BoardState(
                GenerateStatic(),
                GenerateDynamic()
            );
        }

        public BoardStateDynamic Update(BoardStateDynamic boardStateDynamic)
        {

            // IA Stuff
            foreach (var entity in boardStateDynamic.Entities)
            {
                Random random = new Random();
                var diffX = random.Next(0, 3) - 1;

                Random random2 = new Random();
                var diffY = random2.Next(0, 3) -1;

                entity.Value.Coord += new Coord(diffX, diffY);


                if (entity.Value.Coord.X > 19)
                    entity.Value.Coord = new Coord(19, entity.Value.Coord.Y);
                if (entity.Value.Coord.X < 0)
                    entity.Value.Coord = new Coord(0, entity.Value.Coord.Y);
                if (entity.Value.Coord.Y > 19)
                    entity.Value.Coord = new Coord(entity.Value.Coord.X, 19);
                if (entity.Value.Coord.Y < 0)
                    entity.Value.Coord = new Coord(entity.Value.Coord.X, 0);
            }

            // reset who can play
            boardStateDynamic = FinishTurn(boardStateDynamic);

            return boardStateDynamic;
        }

        public BoardStateDynamic SetPlayerPosition(BoardStateDynamic boardStateDynamic, string playerName, Coord coord)
        {
            if (!boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to move but he doesn't exist on the server");
                return boardStateDynamic;
            }

            if (Coord.Distance(player.Entity.Coord, coord) > 1)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to move farther than 1 in a single turn");
                return boardStateDynamic;
            }

            if (player.HasPlayedThisTurn)
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to play twice this turn");
                return boardStateDynamic;
            }

            player.Entity.Coord = coord;
            player.HasPlayedThisTurn = true;

            return boardStateDynamic;
        }

        public BoardStateDynamic AddPlayer(BoardStateDynamic boardStateDynamic, string playerName, Coord coord)
        {
            if (boardStateDynamic.Players.TryGetValue(playerName, out var player))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to be added at {coord} but he already exist at position {player.Entity.Coord} on the server");
                return boardStateDynamic;
            }
            boardStateDynamic.Players.Add(playerName, new Player(new Entity(coord, playerName, 6), true));

            return boardStateDynamic;
        }

        public BoardStateDynamic RemovePlayer(BoardStateDynamic boardStateDynamic, string playerName)
        {
            if (!boardStateDynamic.Players.TryGetValue(playerName, out _))
            {
                _logger.Log(LogLevel.Warning, $"Player {playerName} tried to be removed but he doesn't exist on the server");
                return boardStateDynamic;
            }
            boardStateDynamic.Players.Remove(playerName);

            return boardStateDynamic;
        }

        private BoardStateDynamic FinishTurn(BoardStateDynamic boardStateDynamic)
        {
            foreach (var player in boardStateDynamic.Players)
            {
                player.Value.HasPlayedThisTurn = false;
            }

            return boardStateDynamic;
        }

        private BoardStateStatic GenerateStatic()
        {
            return new BoardStateStatic(
                Map.Generate()
            );
        }

        private BoardStateDynamic GenerateDynamic()
        {
            return new BoardStateDynamic(
                new Dictionary<string, Entity>()
                {
                    { "pwet", new Entity(new Coord(10, 10), "pwet", 7) }
                },
                new Dictionary<string, Player>()
            );
        }
    }

    public interface IBoardStateService
    {
        BoardState Generate();

        BoardStateDynamic Update(BoardStateDynamic boardStateDynamic);

        BoardStateDynamic SetPlayerPosition(BoardStateDynamic boardStateDynamic, string playerName, Coord coord);

        BoardStateDynamic AddPlayer(BoardStateDynamic boardStateDynamic, string playerName, Coord coord);

        BoardStateDynamic RemovePlayer(BoardStateDynamic boardStateDynamic, string playerName);
    }
}