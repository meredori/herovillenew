/**
 * Monster.js - Monster entity for Heroville
 * 
 * Defines the monster entity with health, damage, and variant properties.
 */

class Monster {
    /**
     * Create a new monster
     * @param {Object} config - Configuration for the monster
     */
    constructor(config) {
        this.name = config.name;
        this.health = config.health;
        this.maxHealth = config.maxHealth || config.health;
        this.minDamage = config.minDamage || 1;
        this.maxDamage = config.maxDamage || this.minDamage;
        this.level = config.level || 1;
        this.isVariant = config.isVariant || false;
    }

    /**
     * Calculate the monster's attack damage
     * @returns {number} The amount of damage dealt
     */
    calculateDamage() {
        // Random damage between min and max
        return Math.floor(Math.random() * (this.maxDamage - this.minDamage + 1)) + this.minDamage;
    }

    /**
     * Take damage
     * @param {number} amount - The amount of damage to take
     * @returns {boolean} Whether the monster is still alive
     */
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health > 0;
    }

    /**
     * Check if the monster is defeated
     * @returns {boolean} Whether the monster is defeated
     */
    isDefeated() {
        return this.health <= 0;
    }

    /**
     * Create a deep clone of this monster instance
     * @returns {Monster} A new Monster instance with the same properties
     */
    clone() {
        // Create a new Monster using the current instance's properties
        return new Monster({
            name: this.name,
            health: this.health,
            maxHealth: this.maxHealth,
            minDamage: this.minDamage,
            maxDamage: this.maxDamage,
            level: this.level,
            isVariant: this.isVariant
        });
    }

    /**
     * Get a list of monster variants
     * @returns {Array} Array of monster variants
     */
    static getVariants() {
        return [
            { name: "Giant", isPrefix: true, healthMultiplier: 1.5, damageMultiplier: 1.3 },
            { name: "Fierce", isPrefix: true, healthMultiplier: 1.2, damageMultiplier: 1.5 },
            { name: "Ancient", isPrefix: true, healthMultiplier: 2.0, damageMultiplier: 1.8 },
            { name: "Elder", isPrefix: true, healthMultiplier: 1.8, damageMultiplier: 1.6 },
            { name: "Alpha", isPrefix: false, healthMultiplier: 1.7, damageMultiplier: 1.7 },
            { name: "King", isPrefix: false, healthMultiplier: 2.0, damageMultiplier: 1.9 },
            { name: "Queen", isPrefix: false, healthMultiplier: 1.8, damageMultiplier: 2.0 },
            { name: "Matriarch", isPrefix: false, healthMultiplier: 2.2, damageMultiplier: 1.7 }
        ];
    }

    /**
     * Get a random monster variant
     * @returns {Object} A random variant object
     */
    static getRandomVariant() {
        const variants = Monster.getVariants();
        return variants[Math.floor(Math.random() * variants.length)];
    }

    /**
     * Create a basic monster of the specified type and level
     * @param {string} type - The type of monster to create
     * @param {number} level - The level of the monster
     * @returns {Monster} A new Monster instance
     */
    static createMonster(type, level = 1) {
        // Base stats that scale with level
        const baseHealth = 2 + (level * 5);
        const baseDamage = 1 + Math.floor(level / 2);
        
        return new Monster({
            name: type,
            health: baseHealth,
            maxHealth: baseHealth,
            minDamage: baseDamage,
            maxDamage: baseDamage + 1 + Math.floor(level / 3),
            level: level
        });
    }

    /**
     * Create a variant monster with enhanced stats
     * @param {string} type - The base monster type
     * @param {number} level - The level of the monster
     * @param {Object} variant - The variant to apply
     * @returns {Monster} A new variant Monster instance
     */
    static createVariantMonster(type, level, variant) {
        // Create a basic monster first
        const baseMonster = Monster.createMonster(type, level);
        
        // Apply variant multipliers
        const variantHealth = Math.floor(baseMonster.health * variant.healthMultiplier);
        const variantMinDamage = Math.floor(baseMonster.minDamage * variant.damageMultiplier);
        const variantMaxDamage = Math.floor(baseMonster.maxDamage * variant.damageMultiplier);
        
        // Create variant name
        const name = variant.isPrefix ? 
            `${variant.name} ${baseMonster.name}` : 
            `${baseMonster.name} ${variant.name}`;
        
        // Create the variant monster
        return new Monster({
            name: name,
            health: variantHealth,
            maxHealth: variantHealth,
            minDamage: variantMinDamage,
            maxDamage: variantMaxDamage,
            level: level,
            isVariant: true
        });
    }
}

export { Monster };