/**
 * Combat-simulation.js - Combat simulation utility for Heroville
 * 
 * Provides methods for simulating combat to estimate success chances
 * and support hero decision making.
 */

import { Monster } from '../entities/monster.js';
import { getConsumableById } from '../entities/consumable.js';

class CombatSimulation {
    /**
     * Simulate the hero's chance of clearing the dungeon using actual monsters/boss logic.
     * @param {Hero} hero - The hero attempting the dungeon
     * @param {Dungeon} dungeon - The dungeon to simulate
     * @param {number} [runs=1000] - Number of simulation runs
     * @returns {number} Estimated success percentage (0-100)
     */
    static simulateDungeonSuccessChance(hero, dungeon, runs = 1000) {
        let successes = 0;
        const steps = dungeon.length || 10; // Total steps to reach boss (adjust as needed)
        const encounterRate = dungeon.encounterRate ?? 0.3; // Default 30% if not set

        for (let i = 0; i < runs; i++) {
            // Deep clone hero for simulation
            const simHero = hero.clone ? hero.clone() : JSON.parse(JSON.stringify(hero));
            simHero.health = simHero.maxHealth;
            
            // Calculate total potions in inventory across all potion types
            let totalPotions = 0;
            if (simHero.inventory?.potions) {
                if (typeof simHero.inventory.potions === 'object') {
                    // Sum up all potion quantities from the potions object
                    totalPotions = Object.values(simHero.inventory.potions)
                        .reduce((sum, quantity) => sum + (quantity || 0), 0);
                }
            }
            
            let survived = true;

            // Simulate dungeon steps
            for (let step = 0; step < steps; step++) {
                if (Math.random() < encounterRate) {
                    const monster = CombatSimulation.generateMonster(dungeon);
                    if (!CombatSimulation.simulateCombat(simHero, monster)) {
                        survived = false;
                        break;
                    }
                }
            }

            // Simulate boss if survived all steps
            if (survived) {
                const boss = CombatSimulation.generateFinalMonster(dungeon);
                if (!CombatSimulation.simulateCombat(simHero, boss)) {
                    survived = false;
                }
            }

            if (survived) successes++;
        }
        return Math.round((successes / runs) * 100);
    }

    /**
     * Simulate combat between a hero and a monster (single encounter)
     * Returns true if hero survives, false if defeated
     * @param {Hero} simHero - Simulated hero object
     * @param {Monster} simMonster - Simulated monster object
     * @returns {boolean} Whether the hero survived the encounter
     */
    static simulateCombat(simHero, simMonster) {
        // Clone monster for simulation (assumes monster has a clone method)
        const monster = simMonster.clone ? simMonster.clone() : JSON.parse(JSON.stringify(simMonster));
        monster.health = monster.maxHealth;

        while (simHero.health > 0 && monster.health > 0) {
            // Hero's turn with potion logic
            const monsterMaxHit = monster.maxDamage;
            
            // Check if we have health potions to use (handles both object and legacy formats)
            let hasHealthPotions = false;
            if (simHero.inventory && simHero.inventory.potions) {
                if (typeof simHero.inventory.potions === 'object') {
                    hasHealthPotions = simHero.inventory.potions.health_potion > 0;
                } else if (typeof simHero.inventory.potions === 'number') {
                    // Legacy format support
                    hasHealthPotions = simHero.inventory.potions > 0;
                }
            }
            
            if (monsterMaxHit >= simHero.health && hasHealthPotions) {
                // Use a potion to heal based on potion's effectAmount as percentage of max health
                const healthPotion = getConsumableById('health_potion');
                const healPercentage = healthPotion ? healthPotion.effectAmount : 0.2; // Default to 20% if not found
                const healAmount = Math.floor(simHero.maxHealth * healPercentage);
                simHero.health = Math.min(simHero.health + healAmount, simHero.maxHealth);
                
                // Decrement potions based on format
                if (typeof simHero.inventory.potions === 'object') {
                    simHero.inventory.potions.health_potion -= 1;
                } else if (typeof simHero.inventory.potions === 'number') {
                    simHero.inventory.potions -= 1;
                }
                
                // Hero skips attack this round
            } else {
                // Attack
                const heroDamage = simHero.calculateDamage ? simHero.calculateDamage() : 10;
                monster.health -= heroDamage;
                if (monster.health <= 0) break;
            }
            
            // Monster attacks
            const monsterDamage = monster.calculateDamage ? monster.calculateDamage() : 5;
            simHero.health -= monsterDamage;
        }
        
        // If hero survived, reduce weapon durability once per completed fight
        if (simHero.health > 0 && simHero.equipment && simHero.equipment.weapon) {
            simHero.equipment.weapon.durability = Math.max(0, (simHero.equipment.weapon.durability || 0) - 1);
            
            // Check if weapon broke after combat
            if (simHero.equipment.weapon.durability <= 0) {
                simHero.equipment.weapon = null;
            }
        }
        
        return simHero.health > 0;
    }

    /**
     * Generate a monster based on dungeon difficulty and monster type
     * @param {Object} dungeon - The dungeon to generate a monster for
     * @returns {Object} The generated monster
     */
    static generateMonster(dungeon) {
        return Monster.createMonster(dungeon.monsterType, dungeon.difficulty);
    }
    
    /**
     * Generate a final boss monster for a dungeon
     * @param {Object} dungeon - The dungeon to generate a boss for
     * @returns {Object} The generated boss monster
     */
    static generateFinalMonster(dungeon) {
        return Monster.createVariantMonster(
            dungeon.monsterType,
            dungeon.difficulty * 1.5,
            dungeon.variant
        );
    }
}

export { CombatSimulation };