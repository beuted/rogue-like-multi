using System;
using System.Collections.Generic;

namespace rogue
{
    public enum EntityType
    {
        Snake = 14,
        Dog = 15,
        Rat = 16,
    }

    public static class EntityTypeExtensions
    {
        private static Dictionary<EntityType, int> entityTypeMaxPv = new Dictionary<EntityType, int>()
        {
            { EntityType.Snake, 5 },
            { EntityType.Dog, 3 },
            { EntityType.Rat, 3 },
        };

        private static Dictionary<EntityType, int> entityTypeDamage = new Dictionary<EntityType, int>()
        {
            { EntityType.Snake, 1 },
            { EntityType.Dog, 1 },
            { EntityType.Rat, 1 },
        };

        private static Dictionary<EntityType, Aggressivity> entityTypeAggressivity = new Dictionary<EntityType, Aggressivity>()
        {
            { EntityType.Snake, Aggressivity.Aggressive },
            { EntityType.Dog, Aggressivity.Neutral },
            { EntityType.Rat, Aggressivity.Pacific },
        };

        public static int GetMaxPv(this EntityType entity)
        {
            if (entityTypeMaxPv.TryGetValue(entity, out var pv))
            {
                return pv;
            }
            throw new Exception($"Could not find entity {entity} in entityTypeMaxPv dictionary");
        }

        public static int GetDamage(this EntityType entity)
        {
            if (entityTypeDamage.TryGetValue(entity, out var damage))
            {
                return damage;
            }
            throw new Exception($"Could not find entity {entity} in entityTypeDamage dictionary");
        }

        public static Aggressivity GetAggressivity(this EntityType entity)
        {
            if (entityTypeAggressivity.TryGetValue(entity, out var aggressivity))
            {
                return aggressivity;
            }
            throw new Exception($"Could not find entity {entity} in entityTypeAggressivity dictionary");
        }
    }
}