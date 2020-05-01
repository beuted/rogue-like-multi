using System;
using Newtonsoft.Json;

namespace rogue_like_multi_server
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

        public override string ToString()
        {
            return $"({X}, {Y})";
        }

        public static int Distance(Coord a, Coord b)
        {
            return Math.Abs(a.X - b.X) + Math.Abs(a.Y - b.Y);
        }
    }
}