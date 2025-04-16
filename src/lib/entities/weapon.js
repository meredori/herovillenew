/**
 * Weapon.js - Weapon system for Heroville
 * 
 * Defines weapons that heroes can equip to increase their combat effectiveness.
 * Weapons provide increased damage but have limited durability.
 */

/**
 * List of available weapons in the game
 * Each weapon unlocks at a specific blacksmith level
 */
export const Weapons = [
    {
        id: 'dagger',
        name: 'Dagger',
        description: 'A small but sharp dagger.',
        minDamage: 1,
        maxDamage: 3,
        cost: { monsterParts: 8 },
        salePrice: 3,
        maxDurability: 20,
        requiredBlacksmithLevel: 1
    },
    {
        id: 'shortsword',
        name: 'Short Sword',
        description: 'A basic short sword, effective in combat.',
        minDamage: 2,
        maxDamage: 4,
        cost: { monsterParts: 12 },
        salePrice: 5,
        maxDurability: 25,
        requiredBlacksmithLevel: 2
    },
    {
        id: 'longsword',
        name: 'Long Sword',
        description: 'A heavier sword with better reach.',
        minDamage: 3,
        maxDamage: 6,
        cost: { monsterParts: 20 },
        salePrice: 10,
        maxDurability: 30,
        requiredBlacksmithLevel: 3
    },
    {
        id: 'battleaxe',
        name: 'Battle Axe',
        description: 'A powerful but unwieldy weapon.',
        minDamage: 4,
        maxDamage: 8,
        cost: { monsterParts: 30 },
        salePrice: 15,
        maxDurability: 20,
        requiredBlacksmithLevel: 4
    },
    {
        id: 'greatsword',
        name: 'Great Sword',
        description: 'A massive two-handed sword.',
        minDamage: 5,
        maxDamage: 10,
        cost: { monsterParts: 45 },
        salePrice: 25,
        maxDurability: 35,
        requiredBlacksmithLevel: 5
    }
];

/**
 * Get a weapon by its ID
 * @param {string} id - The ID of the weapon to get
 * @returns {Object|null} The weapon object or null if not found
 */
export function getWeaponById(id) {
    return Weapons.find(weapon => weapon.id === id) || null;
}

/**
 * Get all weapons available at a given blacksmith level
 * @param {number} blacksmithLevel - The level of the blacksmith
 * @returns {Array} Array of weapons available at the specified level
 */
export function getAvailableWeapons(blacksmithLevel) {
    return Weapons.filter(weapon => weapon.requiredBlacksmithLevel <= blacksmithLevel);
}

/**
 * Calculate repair cost for a weapon (half of its sale price, rounded up)
 * @param {Object} weapon - The weapon to calculate repair cost for
 * @returns {number} The gold cost to repair the weapon
 */
export function calculateWeaponRepairCost(weapon) {
    return Math.ceil(weapon.salePrice / 2);
}

/**
 * Create a new weapon instance ready to be equipped
 * @param {string} weaponId - The ID of the weapon to create
 * @returns {Object|null} A new weapon instance with full durability
 */
export function createWeapon(weaponId) {
    const weaponTemplate = getWeaponById(weaponId);
    if (!weaponTemplate) return null;
    
    return {
        ...weaponTemplate,
        durability: weaponTemplate.maxDurability
    };
}

/**
 * Check if a weapon is better than another
 * @param {Object} weapon1 - First weapon to compare 
 * @param {Object} weapon2 - Second weapon to compare
 * @returns {boolean} True if weapon1 is better than weapon2
 */
export function isWeaponBetter(weapon1, weapon2) {
    if (!weapon2) return true;
    if (!weapon1) return false;
    
    // Simple comparison based on average damage
    const avg1 = (weapon1.minDamage + weapon1.maxDamage) / 2;
    const avg2 = (weapon2.minDamage + weapon2.maxDamage) / 2;
    
    return avg1 > avg2;
}