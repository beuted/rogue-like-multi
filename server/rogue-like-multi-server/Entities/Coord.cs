using System;
using EpPathFinding.cs;
using Newtonsoft.Json;

namespace rogue
{
    public struct Coord : IEquatable<Coord>
    {
        [JsonProperty("x")]
        public readonly int X;

        [JsonProperty("y")]
        public readonly int Y;

        public Coord(int x, int y)
        {
            X = x;
            Y = y;
        }

        public override bool Equals(object obj)
        {
            if (obj is Coord)
            {
                return this.Equals((Coord)obj);
            }
            return false;
        }

        public bool Equals(Coord other)
        {
            return X == other.X && Y == other.Y;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(X, Y);
        }

        public static bool operator ==(Coord lhs, Coord rhs)
        {
            return lhs.Equals(rhs);
        }

        public static bool operator !=(Coord lhs, Coord rhs)
        {
            return !(lhs.Equals(rhs));
        }

        public static Coord operator +(Coord lhs, Coord rhs)
        {
            return new Coord(lhs.X + rhs.X, lhs.Y + rhs.Y);
        }

        public static Coord operator -(Coord lhs, Coord rhs)
        {
            return new Coord(lhs.X - rhs.X, lhs.Y - rhs.Y);
        }

        public static FloatingCoord operator *(decimal mult, Coord coord)
        {
            return new FloatingCoord(mult * coord.X, mult * coord.Y);
        }

        public static int Distance(Coord a, Coord b)
        {
            return Math.Abs(a.X - b.X) + Math.Abs(a.Y - b.Y);
        }

        public static int Distance2d(Coord a, Coord b)
        {
            return Math.Max(Math.Abs(a.X - b.X), Math.Abs(a.Y - b.Y));
        }

        public GridPos ToGridPos()
        {
            return new GridPos(X, Y);
        }

        public static Coord FromGridPos(GridPos gridPos)
        {
            return new Coord(gridPos.x, gridPos.y);
        }

        public override string ToString()
        {
            return $"({X}, {Y})";
        }
    }
}