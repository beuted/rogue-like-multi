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
        Backpack = 105,
        Emerald = 106,
        DeadBody1 = 118,
        DeadBody2 = 218,
        DeadBody3 = 228,
    }

    public static class ItemTypeExtensions
    {
        private static Dictionary<ItemType, int> chestItemDropRate = new Dictionary<ItemType, int> {
            { ItemType.Empty, 0 },
            { ItemType.Blood, 0 },
            { ItemType.DeadBody1, 0 },
            { ItemType.DeadBody2, 0 },
            { ItemType.DeadBody3, 0 },
            { ItemType.Wood, 0 },
            { ItemType.Food, 50 },
            { ItemType.Emerald, 60 },
            { ItemType.Sword, 25 },
            { ItemType.Key, 10 },
            { ItemType.Armor, 25 },
            { ItemType.HealthPotion, 25 },
            { ItemType.Backpack, 20 },
        };

        private static Dictionary<EntityType, Dictionary<ItemType, int>> entitiesItemDropRate = new Dictionary<EntityType, Dictionary<ItemType, int>>()
        {
            { EntityType.Rat,  new Dictionary<ItemType, int> {
                { ItemType.Empty, 0 },
                { ItemType.Blood, 0 },
                { ItemType.DeadBody1, 0 },
                { ItemType.DeadBody2, 0 },
                { ItemType.DeadBody3, 0 },
                { ItemType.Wood, 0 },
                { ItemType.Food, 50 },
                { ItemType.Emerald, 25 },
                { ItemType.Sword, 40 },
                { ItemType.Key, 10 },
                { ItemType.Armor, 10 },
                { ItemType.HealthPotion, 10 },
                { ItemType.Backpack, 5 },
            }},
            { EntityType.Dog,  new Dictionary<ItemType, int> {
                { ItemType.Empty, 0 },
                { ItemType.Blood, 0 },
                { ItemType.DeadBody1, 0 },
                { ItemType.DeadBody2, 0 },
                { ItemType.DeadBody3, 0 },
                { ItemType.Wood, 0 },
                { ItemType.Food, 50 },
                { ItemType.Emerald, 40 },
                { ItemType.Sword, 40 },
                { ItemType.Key, 60 },
                { ItemType.Armor, 10 },
                { ItemType.HealthPotion, 10 },
                { ItemType.Backpack, 25 },
            }},
            { EntityType.Snake,  new Dictionary<ItemType, int> {
                { ItemType.Empty, 0 },
                { ItemType.Blood, 0 },
                { ItemType.DeadBody1, 0 },
                { ItemType.DeadBody2, 0 },
                { ItemType.DeadBody3, 0 },
                { ItemType.Wood, 0 },
                { ItemType.Food, 50 },
                { ItemType.Emerald, 60 },
                { ItemType.Sword, 25 },
                { ItemType.Key, 80 },
                { ItemType.Armor, 5 },
                { ItemType.HealthPotion, 60 },
                { ItemType.Backpack, 50 },
            }}
        };

        // Rarity means the item as a dropRate + modificator % chance being drop
        public static int GetDropRate(this ItemType item, Dictionary<ItemType, int> lootRate)
        {
            if (lootRate.TryGetValue(item, out var rarity) && rarity > 0)
            {
                return Math.Min(rarity, 95);
            }
            return 0;
        }

        public static bool CanBePickup(this ItemType item)
        {
            return item != ItemType.Empty & item != ItemType.Blood && item != ItemType.DeadBody1 && item != ItemType.DeadBody2 && item != ItemType.DeadBody3;
        }
    }
}