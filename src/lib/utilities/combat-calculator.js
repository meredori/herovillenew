/**
 * Combat-calculator.js - Utility for combat calculations
 * 
 * Provides methods for calculating damage, success chances, and other combat-related values.
 */

class CombatCalculator {
    /**
     * Calculate random attack damage between min and max values
     * @param {number} minDamage - Minimum damage
     * @param {number} maxDamage - Maximum damage
     * @returns {number} The calculated damage amount
     */
    static calculateAttackDamage(minDamage, maxDamage) {
        return Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
    }
    
    /**
     * Calculate a hero's chance of successfully completing a dungeon
     * @param {Object} hero - The hero attempting the dungeon
     * @param {Object} dungeon - The dungeon being attempted
     * @returns {number} Success chance as a percentage (0-100)
     */
    static calculateDungeonSuccessChance(hero, dungeon) {
        // Base success chance with some randomness
        let baseChance = 100 - (dungeon.difficulty * 10);
        
        // Adjust for hero health
        const healthFactor = hero.health / hero.maxHealth;
        
        // Adjust for hero level relative to dungeon difficulty
        const levelFactor = hero.level / dungeon.difficulty;
        
        // Calculate final chance
        let finalChance = baseChance * healthFactor * levelFactor;
        
        // Apply some randomness (±10%)
        const randomFactor = 0.9 + (Math.random() * 0.2);
        finalChance *= randomFactor;
        
        // Clamp to valid percentage range (0-100)
        return Math.max(0, Math.min(100, Math.floor(finalChance)));
    }
}

export { CombatCalculator };