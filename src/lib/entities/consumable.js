// src/lib/entities/consumable.js
// Defines consumable items such as potions

export const Consumables = [
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 10 health to all heroes.',
    cost: { monsterParts: 5 },
    salePrice: 1, // Gold cost for a hero to buy from town
    effect: 'healing',
    effectAmount: 10,
    icon: '❤️',
    type: 'potion'
  }
  // Add more consumables here as needed
];

export function getConsumableById(id) {
  return Consumables.find(c => c.id === id);
}