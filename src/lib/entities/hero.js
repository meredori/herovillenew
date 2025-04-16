/**
 * Hero.js - Hero entity for Heroville
 * 
 * Defines the hero entity with health, damage, experience, and equipment slots.
 */

import { CombatCalculator } from '../utilities/combat-calculator.js';
import { CombatSimulation } from '../utilities/combat-simulation.js';

class Hero {
    constructor(name) {
        this.id = this.generateId();
        this.name = name || this.generateRandomName();
        this.health = 50;
        this.maxHealth = 50;
        this.minDamage = 1;
        this.maxDamage = 1;
        this.experience = 0;
        this.level = 1;
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.inventory = {
            gold: 0,
            monsterParts: 0,
            potions: {} // Keep potions as an object for different potion types
        };
        
        // Hero status tracking properties
        this.status = "idle"; // Can be: "idle", "exploring", "healing"
        this.dungeonId = null; // ID of the dungeon the hero is exploring (if any)
        this.inCombat = false; // Whether the hero is currently in combat
        this.dungeonProgress = 0; // Current progress in the dungeon (steps taken)
        this.dungeonSuccessChance = null; // Cached success chance for current dungeon
        this.hasShoppedForUpgrades = false; // Track if hero has already shopped for upgrades
    }

    /**
     * Generate a unique ID for the hero
     * @returns {string} A unique ID
     */
    generateId() {
        return 'hero_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    }

    /**
     * Generate a random name for the hero
     * @returns {string} A random hero name
     */
    generateRandomName() {
        const firstNames = ['Brave', 'Mighty', 'Swift', 'Wise', 'Noble', 'Bold', 'Valiant'];
        const lastNames = ['Warrior', 'Knight', 'Guardian', 'Protector', 'Defender', 'Champion', 'Sentinel'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }

    /**
     * Calculate the hero's attack damage
     * @returns {number} The amount of damage dealt
     */
    calculateDamage() {
        if (this.equipment.weapon) {
            const weapon = this.equipment.weapon;
            // Weapon's damage range + hero's base damage - 1
            return CombatCalculator.calculateAttackDamage(
                weapon.minDamage + this.minDamage - 1,
                weapon.maxDamage + this.maxDamage - 1
            );
        }
        return CombatCalculator.calculateAttackDamage(this.minDamage, this.maxDamage);
    }

    /**
     * Add experience to the hero (returns a new Hero instance)
     * @param {number} amount - The amount of experience to add
     * @returns {Hero} Updated hero instance
     */
    addExperience(amount) {
        let experience = this.experience + amount;
        let level = this.level;
        let maxHealth = this.maxHealth;
        let health = this.health;
        let hasShoppedForUpgrades = this.hasShoppedForUpgrades;
        // Check for level up
        const experienceNeeded = 100 * level;
        if (experience >= experienceNeeded) {
            level += 1;
            maxHealth += 5;
            health = maxHealth;
            experience -= 100 * (level - 1);
            hasShoppedForUpgrades = false;
        }
        const updated = new Hero(this.name);
        Object.assign(updated, this, {
            experience,
            level,
            maxHealth,
            health,
            hasShoppedForUpgrades
        });
        return updated;
    }

    /**
     * Level up the hero
     */
    levelUp() {
        this.level += 1;
        
        // Increase stats with level
        this.maxHealth += 10;
        this.health = this.maxHealth; // Fully heal on level up
        
        // Remove used experience
        this.experience = 0;
    }

    /**
     * Reset the hero's dungeon progress and related states
     * @param {string} [reason="unspecified"] - Reason for resetting progress (e.g., "victory", "defeat")
     * @param {boolean} [resetExperience=false] - Whether to reset experience for the current level
     * @param {Object} [game=null] - Game instance for logging (optional)
     * @param {Object} [dungeon=null] - Dungeon instance for explorer cleanup (optional)
     */
    resetDungeonProgress(reason = "unspecified", resetExperience = false, game = null, dungeon = null) {
        // Store previous state for logging
        const wasExploring = this.status === "exploring";
        const dungeonId = this.dungeonId;

        // Clean up explorer state in the dungeon if provided
        if (wasExploring && dungeon && typeof dungeon.cleanupExplorer === "function") {
            dungeon.cleanupExplorer(this.id);
        }

        // Reset dungeon-related properties
        this.status = "idle";
        this.dungeonId = null;
        this.inCombat = false;
        this.dungeonProgress = 0;
        this.dungeonSuccessChance = null;
        
        // Reset experience if specified (typically on defeat)
        if (resetExperience) {
            this.experience = 0;
        }
        
        // Lose all inventory on defeat
        if (reason === "defeat") {
            this.inventory.gold = 0;
            this.inventory.monsterParts = 0;
        }
        
        // Log the transition if game instance is provided
        if (game && wasExploring) {
            const actionText = reason === "defeat" ? "was defeated and" : 
                              reason === "victory" ? "was victorious and" : "";
            game.log(`${this.name} ${actionText} returns to town.`);
        }
        
        return { previousDungeonId: dungeonId };
    }

    /**
     * Take damage (returns a new Hero instance)
     * @param {number} amount - The amount of damage to take
     * @returns {Hero} Updated hero instance
     */
    takeDamage(amount) {
        let health = Math.max(0, this.health - amount);
        let status = this.status;
        let inventory = { ...this.inventory };
        let experience = this.experience;
        if (health <= 0 && status === "exploring") {
            // On defeat, reset progress and inventory
            health = 0;
            status = "idle";
            inventory.gold = 0;
            inventory.monsterParts = 0;
            experience = 0;
        }
        const updated = new Hero(this.name);
        Object.assign(updated, this, {
            health,
            status,
            inventory,
            experience
        });
        return updated;
    }

    /**
     * Heal the hero (returns a new Hero instance)
     * @param {number} amount - The amount to heal
     * @returns {Hero} Updated hero instance
     */
    heal(amount) {
        // Calculate the new health by adding amount, but not exceeding maxHealth
        const newHealth = Math.min(this.maxHealth, this.health + amount);
        // Update status to idle if fully healed and was healing
        const newStatus = (newHealth >= this.maxHealth && this.status === "healing") ? "idle" : this.status;
        
        // Create a new hero instance
        const updated = new Hero(this.name);
        
        // Copy all properties from the current hero to the new instance
        Object.assign(updated, this);
        
        // Then specifically set the new health and status
        updated.health = newHealth;
        updated.status = newStatus;
        
        return updated;
    }

    /**
     * Spend monster parts to heal quickly. Each monster part heals 5 HP.
     * Spent monster parts are removed from hero inventory and added to the town's inventory.
     * @param {number} partsToSpend - Number of monster parts to spend
     * @param {Object} game - The game instance (for town inventory)
     * @returns {Hero} The updated hero instance
     */
    fastHeal(partsToSpend, game) {
        if (!partsToSpend || partsToSpend <= 0) return this;
        const actualParts = Math.min(partsToSpend, this.inventory.monsterParts);
        if (actualParts === 0) return this;
        const healAmount = actualParts * 5;
        this.inventory.monsterParts -= actualParts;
        if (game && game.resources) {
            game.resources.monsterParts += actualParts;
        }
        // Apply healing and return the updated hero instance
        return this.heal(healAmount);
    }

    /**
     * Set the hero's status (returns a new Hero instance)
     * @param {string} status - New status
     * @param {string|null} dungeonId - ID of the dungeon (if status is "exploring")
     * @returns {Hero} Updated hero instance
     */
    setStatus(status, dungeonId = null) {
        let inCombat = this.inCombat;
        let hasShoppedForUpgrades = this.hasShoppedForUpgrades;
        if (status !== "exploring") {
            inCombat = false;
        } else {
            hasShoppedForUpgrades = false; // Reset when entering a dungeon
        }
        const updated = new Hero(this.name);
        Object.assign(updated, this, {
            status,
            dungeonId: status === "exploring" ? dungeonId : null,
            inCombat,
            hasShoppedForUpgrades
        });
        return updated;
    }

    /**
     * Set the hero's combat state
     * @param {boolean} inCombat - Whether the hero is in combat
     */
    setCombat(inCombat) {
        this.inCombat = inCombat;
    }
    
    /**
     * Calculate the hero's chance of successfully completing the current dungeon
     * @param {Object} dungeon - The dungeon the hero is currently exploring
     * @returns {number} Success chance as a percentage (0-100)
     */
    calculateDungeonSuccessChance(dungeon) {
        // Use the new CombatSimulation class for simulation-based success chance
        return CombatSimulation.simulateDungeonSuccessChance(this, dungeon);
    }
    
    /**
     * Decide what the hero should do next based on their current state
     * @param {Array} dungeons - Available dungeons
     * @param {Object} gameState - Current state of the game
     * @returns {Object} Action to take: { action: string, target: any }
     */
    decideNextAction(dungeons, gameState) {
        // If hero is not idle, continue what they're doing
        if (this.status !== "idle") {
            return { action: this.status, target: this.dungeonId };
        }
        
        // Priority 1: Heal if not at full health
        if (this.health < this.maxHealth) {
            this.setStatus("healing");
            return { action: "healing", target: null };
        }
        
        // Find the best dungeon first (this will be used for shopping and repair decisions)
        let bestDungeon = null;
        let highestSuccessChance = 0;
        
        // Filter to only consider discovered dungeons
        if (dungeons && dungeons.length > 0) {
            const availableDungeons = dungeons.filter(d => d.discovered);
            
            for (const dungeon of availableDungeons) {
                const successChance = this.calculateDungeonSuccessChance(dungeon);
                
                // For dungeons with >50% success chance, pick the strongest
                if (successChance >= 50 && (bestDungeon === null || dungeon.difficulty > bestDungeon.difficulty)) {
                    bestDungeon = dungeon;
                    highestSuccessChance = successChance;
                } 
                // If no dungeon has >50% success, track the one with highest chance
                else if (successChance > highestSuccessChance && bestDungeon === null) {
                    bestDungeon = dungeon;
                    highestSuccessChance = successChance;
                }
            }
        }
        
        // Priority 2: Shop for upgrades if hasn't done so since last level up
        if (!this.hasShoppedForUpgrades) {
            // Mark as shopped before we make any weapon/shopping decisions
            this.hasShoppedForUpgrades = true;
            
            // Shopping will now include checking for weapons and repairs
            // The game.js will handle the actual purchase and repairs
            return { 
                action: "shopping", 
                target: null,
                bestDungeon: bestDungeon ? {
                    id: bestDungeon.id,
                    length: bestDungeon.length,
                    difficulty: bestDungeon.difficulty
                } : null
            };
        }
        
        // Priority 3: Enter a dungeon with good success chance
        if (bestDungeon) {
            if (gameState && gameState.explorationSystem && typeof gameState.explorationSystem.assignHeroToDungeon === 'function') {
                gameState.explorationSystem.assignHeroToDungeon(this, bestDungeon);
            } else {
                this.setStatus("exploring", bestDungeon.id);
            }
            this.dungeonSuccessChance = highestSuccessChance; // Store success chance
            return { action: "exploring", target: bestDungeon.id };
        }
        
        // If no viable dungeon found, stay idle
        return { action: "idle", target: null };
    }

    /**
     * Create a deep clone of this hero instance
     * @returns {Hero} A new Hero instance with the same properties
     */
    clone() {
        const cloned = new Hero(this.name);
        Object.assign(cloned, JSON.parse(JSON.stringify(this)));
        return cloned;
    }

    /**
     * Get a simple representation of the hero for display
     * @returns {Object} A simple object with hero details
     */
    getDisplayInfo() {
        return {
            id: this.id,
            name: this.name,
            health: `${this.health}/${this.maxHealth}`,
            damage: `${this.minDamage}-${this.maxDamage}`,
            level: this.level,
            experience: this.experience,
            status: this.status,
            dungeonId: this.dungeonId,
            inCombat: this.inCombat,
            dungeonProgress: this.dungeonProgress,
            dungeonSuccessChance: this.dungeonSuccessChance,
            equipment: {
                weapon: this.equipment.weapon ? this.equipment.weapon.name : 'None',
                armor: this.equipment.armor ? this.equipment.armor.name : 'None',
                accessory: this.equipment.accessory ? this.equipment.accessory.name : 'None'
            },
            inventory: { ...this.inventory }
        };
    }
}

export { Hero };