using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using rogue;

namespace rogue_like_multi_server
{
    public interface IRandomGeneratorService
    {
        int Generate(int min, int max);
    }

    public class RandomGeneratorService: IRandomGeneratorService
    {
        private Random _rnd;
        public RandomGeneratorService()
        {
            _rnd = new Random();
        }

        public int Generate(int min, int max)
        {
            return _rnd.Next(min, max+1);
        }
    }
}