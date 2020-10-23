using System;
using EpPathFinding.cs;
using Newtonsoft.Json;

namespace rogue
{
    public struct FloatingCoord : IEquatable<FloatingCoord>
    {
        [JsonProperty("x")]
        public readonly decimal X;

        [JsonProperty("y")]
        public readonly decimal Y;

        public FloatingCoord(decimal x, decimal y)
        {
            X = x;
            Y = y;
        }

        public override bool Equals(object obj)
        {
            if (obj is FloatingCoord)
            {
                return this.Equals((FloatingCoord)obj);
            }
            return false;
        }

        public bool Equals(FloatingCoord other)
        {
            return X == other.X && Y == other.Y;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(X, Y);
        }

        public static bool operator ==(FloatingCoord lhs, FloatingCoord rhs)
        {
            return lhs.Equals(rhs);
        }

        public static bool operator !=(FloatingCoord lhs, FloatingCoord rhs)
        {
            return !(lhs.Equals(rhs));
        }

        public static FloatingCoord operator +(FloatingCoord lhs, FloatingCoord rhs)
        {
            return new FloatingCoord(lhs.X + rhs.X, lhs.Y + rhs.Y);
        }

        public static FloatingCoord operator *(decimal mult, FloatingCoord coord)
        {
            return new FloatingCoord(mult * coord.X, mult * coord.Y);
        }

        public static FloatingCoord operator -(FloatingCoord lhs, FloatingCoord rhs)
        {
            return new FloatingCoord(lhs.X - rhs.X, lhs.Y - rhs.Y);
        }

        public static decimal Distance(FloatingCoord a, FloatingCoord b)
        {
            return Math.Abs(a.X - b.X) + Math.Abs(a.Y - b.Y);
        }

        public static decimal Distance2d(FloatingCoord a, FloatingCoord b)
        {
            return Math.Max(Math.Abs(a.X - b.X), Math.Abs(a.Y - b.Y));
        }

        public Coord ToCoord()
        {
            return new Coord(Convert.ToInt32(X), Convert.ToInt32(Y));
        }

        public GridPos ToGridPos()
        {
            return new GridPos(Convert.ToInt32(X), Convert.ToInt32(Y));
        }

        public static FloatingCoord FromGridPos(GridPos gridPos)
        {
            return new FloatingCoord(gridPos.x, gridPos.y);
        }

        public override string ToString()
        {
            return $"({X}, {Y})";
        }
    }
}