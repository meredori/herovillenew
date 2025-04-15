/**
 * Combat.js - Combat system for Heroville
 * 
 * Handles all combat-related functionality including:
 * - Processing combat rounds between heroes and monsters
 * - Managing combat rewards and consequences
 */

import { Monster } from '../entities/monster.js';
import { updateDungeon, updateHero } from './gameStore.js';

class CombatSystem {
    constructor(game) {
        this.game = game;
    }

    /**
     * Process a single round of combat for all heroes currently in combat
     * This method is called once per game tick
     */
    processCombatRounds() {
        // Find all heroes currently in combat
        const heroesInCombat = this.game.heroes.filter(h => h.inCombat);
        
        // No heroes in combat, nothing to do
        if (heroesInCombat.length === 0) {
            return;
        }
        
        // Process one round of combat for each hero
        for (const hero of heroesInCombat) {
            // Skip if somehow hero isn't actually in combat
            if (!hero.inCombat) continue;
            
            // Find the dungeon this hero is exploring
            const dungeon = this.game.dungeons.find(d => d.id === hero.dungeonId);
            if (!dungeon) continue;
            
            // Get the explorer data and current combat encounter
            const explorerData = dungeon.getExplorerProgress(hero.id);
            if (!explorerData) continue;
            
            if (explorerData.currentMonster) {
                this.processMonsterCombatRound(dungeon, hero, explorerData.currentMonster);
                continue;
            }
            
            // If we get here, hero is marked as in combat but has no monster
            // This shouldn't happen, but let's fix it
            hero.setCombat(false);
        }
    }

    /**
     * Handles the hero's turn in combat, including potion logic.
     * If the monster's max hit can defeat the hero, the hero will use a potion (if available) to heal 20% of max health (rounded down) instead of attacking.
     * @param {Hero} hero - The hero in combat
     * @param {Monster} monster - The monster being fought
     * @returns {Object} { action: 'attack' | 'heal', damage: number, healed: number }
     */
    heroTurn(hero, monster) {
        const monsterMaxHit = monster.maxDamage;
        // If monster's max hit can defeat the hero, try to heal
        if (
            monsterMaxHit > hero.health &&
            hero.inventory && hero.inventory.potions > 0
        ) {
            // Use a potion to heal 20% of max health (rounded down)
            const healAmount = Math.floor(hero.maxHealth * 0.2);
            hero.health = Math.min(hero.health + healAmount, hero.maxHealth);
            hero.inventory.potions -= 1;
            return { action: 'heal', damage: 0, healed: healAmount };
        } else {
            // Attack
            const heroDamage = hero.calculateDamage();
            monster.takeDamage(heroDamage);
            return { action: 'attack', damage: heroDamage, healed: 0 };
        }
    }

    /**
     * Process a single round of combat between a hero and a standard monster
     * @param {Dungeon} dungeon - The dungeon where combat occurs
     * @param {Hero} hero - The hero in combat
     * @param {Monster} monster - The monster being fought
     */
    processMonsterCombatRound(dungeon, hero, monster) {
        // Get explorer data
        const explorerData = dungeon.getExplorerProgress(hero.id);
        
        // Track if this is the first round of combat
        const isFirstRound = !explorerData.combatRound;
        
        // Initialize or increment combat round
        explorerData.combatRound = (explorerData.combatRound || 0) + 1;
        
        // Log first round of combat
        if (isFirstRound) {
            this.game.log(`${hero.name} engages in combat with a ${monster.name}!`);
        }
        
        // Hero's turn
        const heroAction = this.heroTurn(hero, monster);
        if (heroAction.action === 'heal') {
            this.game.log(`${hero.name} uses a potion to heal for ${heroAction.healed} health!`);
            updateHero(hero.id, { health: hero.health, potions: hero.inventory.potions });
        } else {
            this.game.log(`Round ${explorerData.combatRound}: ${hero.name} hits the ${monster.name} for ${heroAction.damage} damage.`);
            updateHero(hero.id, { health: hero.health, experience: hero.experience });
        }
        updateDungeon(dungeon.id, dungeon);
        
        // Check if monster is defeated
        if (monster.isDefeated()) {
            hero.setCombat(false);
            // Use reactive dungeon update for encounter completion
            const updatedDungeon = dungeon.completeEncounterReactive(hero.id);
            this.replaceDungeon(updatedDungeon);
            
            // Rewards: use isVariant to determine loot
            let expGained, goldGained, partsGained;
            if (monster.isVariant) {
                expGained = 50 * dungeon.difficulty;
                goldGained = dungeon.difficulty;
                partsGained = 0;
                this.awardLoot(hero, goldGained, partsGained);
                updatedDungeon.completed = true;
                // Clean up explorer state and reset hero after final boss
                const cleanedDungeon = updatedDungeon.removeExplorerReactive(hero.id);
                updateDungeon(dungeon.id, cleanedDungeon);
                hero.resetDungeonProgress("victory", false, this.game, cleanedDungeon);
                updateHero(hero.id, { ...hero });
                return;
            } else {
                expGained = 10 * dungeon.difficulty;
                goldGained = 0;
                partsGained = monster.level;
                this.awardLoot(hero, goldGained, partsGained);
                
                // Ensure hero can continue exploring after combat
                const explorerData = updatedDungeon.getExplorerProgress(hero.id);
                if (explorerData) {
                    delete explorerData.combatRound;
                    explorerData.currentMonster = null;
                }
                updateDungeon(dungeon.id, updatedDungeon);
            }
            
            // Add experience and check for level up
            const updatedHero = hero.addExperience(expGained);
            updateHero(hero.id, { ...updatedHero });
            
            this.game.log(`${hero.name} defeats the ${monster.name}!`);
            this.game.log(`Gained: ${expGained} experience, ${goldGained} gold, and ${partsGained} monster parts.`);
            
            if (updatedHero.level > hero.level) {
                this.game.log(`${updatedHero.name} has leveled up to level ${updatedHero.level}!`);
            }
            
            // Reset combat round tracker
            delete explorerData.combatRound;
            
            return;
        }
        
        // Monster attacks
        const monsterDamage = monster.calculateDamage();
        const damagedHero = hero.takeDamage(monsterDamage);
        this.game.log(`Round ${explorerData.combatRound}: The ${monster.name} hits ${hero.name} for ${monsterDamage} damage.`);
        updateHero(hero.id, { ...damagedHero });
        updateDungeon(dungeon.id, dungeon);
        
        // Check if hero is defeated
        if (damagedHero.health <= 0) {
            damagedHero.resetDungeonProgress("defeat", true, this.game, dungeon);
            // Remove hero from dungeon's explorer tracking (reactively)
            const updatedDungeon = dungeon.removeExplorerReactive(hero.id);
            updateDungeon(dungeon.id, updatedDungeon);
            
            // Reset combat round tracker
            delete explorerData.combatRound;
            // Update hero for reactivity after defeat
            updateHero(hero.id, { ...damagedHero });
        }
    }

    /**
     * Award loot to the hero after defeating a monster
     * @param {Hero} hero - The hero who defeated the monster
     * @param {number} goldGained - Amount of gold to award
     * @param {number} partsGained - Amount of monster parts to award
     */
    awardLoot(hero, goldGained, partsGained) {
        hero.inventory.gold += goldGained;
        hero.inventory.monsterParts += partsGained;
        
        // Check if this is the first monster part gained
        if (partsGained > 0 && hero.inventory.monsterParts === partsGained) {
            this.game.unlockApothecaryBuilding();
        }
    }

    /**
     * Generate a monster based on dungeon difficulty and monster type
     * @param {Object} dungeon - The dungeon to generate a monster for
     * @returns {Object} The generated monster
     */
    generateMonster(dungeon) {
        return Monster.createMonster(dungeon.monsterType, dungeon.difficulty);
    }
    
    /**
     * Generate a final boss monster for a dungeon
     * @param {Object} dungeon - The dungeon to generate a boss for
     * @returns {Object} The generated boss monster
     */
    generateFinalMonster(dungeon) {
        return Monster.createVariantMonster(
            dungeon.monsterType,
            dungeon.difficulty * 1.5,
            dungeon.variant
        );
    }

    /**
     * Replace hero in the heroes array to trigger reactivity
     * @param {Hero} hero - The hero to replace
     */
    replaceHero(hero) {
        const HeroClass = hero.constructor;
        const updatedHero = new HeroClass(hero.name);
        Object.assign(updatedHero, hero);
        this.game.heroes = this.game.heroes.map(h => h.id === hero.id ? updatedHero : h);
    }

    /**
     * Replace dungeon in the dungeons array to trigger reactivity
     * @param {Dungeon} dungeon - The dungeon to replace
     */
    replaceDungeon(dungeon) {
        this.game.dungeons = this.game.dungeons.map(d => d.id === dungeon.id ? dungeon : d);
    }

    /**
     * Simulate the hero's chance of clearing the dungeon using actual monsters/boss logic.
     * @param {Hero} hero - The hero attempting the dungeon
     * @param {Dungeon} dungeon - The dungeon to simulate
     * @param {number} [runs=1000] - Number of simulation runs
     * @returns {number} Estimated success percentage (0-100)
     */
    simulateDungeonSuccessChance(hero, dungeon, runs = 1000) {
        let successes = 0;
        const steps = dungeon.length || 10; // Total steps to reach boss (adjust as needed)
        const encounterRate = dungeon.encounterRate ?? 0.3; // Default 30% if not set

        for (let i = 0; i < runs; i++) {
            // Deep clone hero for simulation
            const simHero = hero.clone ? hero.clone() : JSON.parse(JSON.stringify(hero));
            simHero.health = simHero.maxHealth;
            if (simHero.inventory?.potions) {
                console.log(`Simulating with ${simHero.inventory.potions} potions`);
            }
            let survived = true;

            // Simulate dungeon steps
            for (let step = 0; step < steps; step++) {
                if (Math.random() < encounterRate) {
                    const monster = this.generateMonster(dungeon);
                    if (!this.simulateCombat(simHero, monster)) {
                        survived = false;
                        break;
                    }
                }
            }

            // Simulate boss if survived all steps
            if (survived) {
                const boss = this.generateFinalMonster(dungeon);
                if (!this.simulateCombat(simHero, boss)) {
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
     */
    simulateCombat(simHero, simMonster) {
        // Clone monster for simulation (assumes monster has a clone method)
        const monster = simMonster.clone ? simMonster.clone() : JSON.parse(JSON.stringify(simMonster));
        monster.health = monster.maxHealth;

        while (simHero.health > 0 && monster.health > 0) {
            // Hero's turn with potion logic
            const monsterMaxHit = monster.maxDamage;
            if (
                monsterMaxHit > simHero.health &&
                simHero.inventory && simHero.inventory.potions > 0
            ) {
                // Use a potion to heal 20% of max health (rounded down)
                const healAmount = Math.floor(simHero.maxHealth * 0.2);
                simHero.health = Math.min(simHero.health + healAmount, simHero.maxHealth);
                simHero.inventory.potions -= 1;
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
        return simHero.health > 0;
    }
}

export { CombatSystem };