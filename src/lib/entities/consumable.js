// src/lib/entities/consumable.js
// Defines consumable items such as potions

export const Consumables = [
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 20% of maximum health to a hero.',
    cost: { monsterParts: 5 },
    salePrice: 1, // Gold cost for a hero to buy from town
    effect: 'healing',
    effectAmount: 0.2, // 20% of maximum health
    icon: '❤️',
    type: 'potion',
    maxStack: 5  // Maximum number of this potion a hero can carry
  }
  // Add more consumables here as needed
];

export function getConsumableById(id) {
  return Consumables.find(c => c.id === id);
}

// Default maximum stack size for potions if not specified
export const DEFAULT_MAX_POTIONS = 5;

// Helper function to get the maximum stack size for a consumable
export function getMaxStack(consumableId) {
  const consumable = getConsumableById(consumableId);
  return consumable?.maxStack || DEFAULT_MAX_POTIONS;
}

/**
 * Get all potions available at a given apothecary level
 * @param {number} apothecaryLevel - The level of the apothecary
 * @returns {Array} Array of potions available at the specified level
 */
export function getAvailablePotions(apothecaryLevel) {
    return Consumables.filter(
        c => c.type === 'potion' && (!c.requiredApothecaryLevel || c.requiredApothecaryLevel <= apothecaryLevel)
    );
}