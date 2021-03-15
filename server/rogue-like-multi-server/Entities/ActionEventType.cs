using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace rogue
{
    public enum ActionEventType
    {
        Attack = 0,
        VoteResult = 1,
        EndGame = 2,
        ShieldBreak = 3,
        Heal = 4,
        FlashIn = 5,
        FlashOut = 6
    }
}
