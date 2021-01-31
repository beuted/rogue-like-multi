using System;
using System.Collections.Generic;

namespace rogue
{
    public enum ItemType
    {
        Empty = -1,
        Key = 57,
        Sword = 46,
        Armor = 49,
        Food = 58,
        Wood = 100,
        Blood = 102,
        HealthPotion = 103,
        Backpack = 105
    }

    public static class ItemTypeExtensions
    {
        private static Dictionary<ItemType, int> itemDropRate = new Dictionary<ItemType, int>()
        {
            { ItemType.Empty, 0 },
            { ItemType.Blood, 0 },
            { ItemType.Food, 50 },
            { ItemType.Wood, 25 },
            { ItemType.Sword, 25 },
            { ItemType.Key, 10 },
            { ItemType.Armor, 10 },
            { ItemType.HealthPotion, 10 },
            { ItemType.Backpack, 5 },
        };

        // Rarity means the item as a dropRate + modificator % chance being drop
        public static int GetDropRate(this ItemType item, int modificator = 0)
        {
            if (itemDropRate.TryGetValue(item, out var rarity) && rarity > 0)
            {
                return Math.Min(rarity + modificator, 95);
            }
            return 0;
        }
    }
}