/**
 * Combat-calculator.js - Utility for combat calculations
 * 
 * Provides methods for calculating damage and other combat-related values.
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
}

export { CombatCalculator };