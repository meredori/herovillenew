/**
 * Exploration.js - Dungeon exploration system for Heroville
 * 
 * Handles all dungeon exploration functionality including:
 * - Advancing heroes through dungeons
 * - Managing encounters
 * - Handling dungeon completion
 */

import { updateDungeon, updateHero } from './gameStore.js';
import { Monster } from '../entities/monster.js';

class ExplorationSystem {
    constructor(game) {
        this.game = game;
    }

    /**
     * Process automatic dungeon exploration for all heroes
     * Makes heroes take steps in dungeons automatically each tick
     */
    processAutomaticDungeonExploration() {
        // Get all discovered dungeons
        const discoveredDungeons = this.game.dungeons.filter(d => d.discovered);
        
        // For each discovered dungeon
        for (const dungeon of discoveredDungeons) {
            // Find all heroes exploring this dungeon who aren't in combat
            const explorers = this.game.heroes.filter(h => 
                h.status === "exploring" && 
                h.dungeonId === dungeon.id && 
                !h.inCombat
            );
            
            // Process each hero's exploration separately
            for (const hero of explorers) {
                if (hero.inCombat) continue;
                
                // Initialize or get explorer progress
                const explorerData = this.initializeExplorerProgress(dungeon, hero);
                
                // Process exploration based on current state
                if (explorerData.currentMonster) {
                    this.handleMonsterEncounter(dungeon, hero, explorerData);
                } else if (explorerData.finalMonsterDefeated && explorerData.encounteredFinalMonster) {
                    // Handle dungeon completion after defeating final boss
                    this.handleDungeonCompletion(dungeon, hero);
                } else {
                    this.advanceHeroInDungeon(dungeon, hero);
                }
            }
        }
    }

    /**
     * Initialize or get a hero's explorer progress in a dungeon
     * @param {Dungeon} dungeon - The dungeon being explored
     * @param {Hero} hero - The hero exploring
     * @returns {Object} The explorer progress data
     */
    initializeExplorerProgress(dungeon, hero) {
        let updatedDungeon = dungeon;
        let explorerProgress = dungeon.getExplorerProgress(hero.id);
        
        // If hero isn't registered in the dungeon yet, add them (reactively)
        if (!explorerProgress) {
            updatedDungeon = dungeon.addExplorerReactive(hero.id, hero.dungeonProgress || 0);
            updateDungeon(dungeon.id, updatedDungeon);
            explorerProgress = updatedDungeon.getExplorerProgress(hero.id);
        }
        
        // Fix for loaded saves: if we're at final boss but no monster exists, create one
        if (explorerProgress.encounteredFinalMonster && !explorerProgress.currentMonster && !explorerProgress.finalMonsterDefeated) {
            this.createFinalBossEncounter(dungeon, hero, explorerProgress);
        }
        
        return explorerProgress;
    }

    /**
     * Create a final boss encounter when required
     * @param {Dungeon} dungeon - The dungeon being explored
     * @param {Hero} hero - The hero exploring
     * @param {Object} explorerData - The explorer progress data
     */
    createFinalBossEncounter(dungeon, hero, explorerData) {
        // Generate a variant monster for the final encounter
        const finalBoss = Monster.createVariantMonster(
            dungeon.monsterType,
            dungeon.difficulty * 1.5,
            dungeon.variant || Monster.getRandomVariant()
        );
        finalBoss.isVariant = true;
        
        // Update the explorer's current monster (need to make a new copy for reactivity)
        const reactiveUpdatedDungeon = dungeon.cloneWithUpdatedExplorers();
        const explorer = reactiveUpdatedDungeon.explorers.get(hero.id);
        if (explorer) {
            explorer.currentMonster = finalBoss;
            updateDungeon(dungeon.id, reactiveUpdatedDungeon);
            this.game.log(`${hero.name} resumes the fight with ${finalBoss.name}!`);
        }
    }

    /**
     * Handle a hero's encounter with any monster (regular or boss)
     * @param {Dungeon} dungeon - The dungeon being explored
     * @param {Hero} hero - The hero exploring
     * @param {Object} explorerData - The explorer progress data
     */
    handleMonsterEncounter(dungeon, hero, explorerData) {
        if (!hero.inCombat) {
            hero.setCombat(true);
            
            // Tailor message based on whether it's a final boss or regular monster
            if (explorerData.encounteredFinalMonster) {
                this.game.log(`${hero.name} prepares to fight the final boss in ${dungeon.name}!`);
            } else {
                this.game.log(`${hero.name} faces a ${explorerData.currentMonster.name}!`);
            }
        }
    }

    /**
     * Handle dungeon completion after defeating the final boss
     * @param {Dungeon} dungeon - The dungeon being explored
     * @param {Hero} hero - The hero exploring
     */
    handleDungeonCompletion(dungeon, hero) {
        const updatedDungeon = dungeon.removeExplorerReactive(hero.id);
        updateDungeon(dungeon.id, updatedDungeon);
        hero.resetDungeonProgress("victory", false, this.game, updatedDungeon);
    }

    /**
     * Advance a hero through a dungeon to the next step
     * @param {Dungeon} dungeon - The dungeon being explored
     * @param {Hero} hero - The hero exploring
     */
    advanceHeroInDungeon(dungeon, hero) {
        // Ready to advance (reactively)
        const { dungeon: newDungeon, result } = dungeon.advanceExplorerReactive(hero.id);
        
        // Update hero's progress
        const newProgress = newDungeon.getExplorerProgress(hero.id)?.progress || 0;
        // Replace hero in array for Svelte reactivity, preserving Hero class
        const HeroClass = hero.constructor;
        const updatedHero = new HeroClass(hero.name);
        Object.assign(updatedHero, hero, { dungeonProgress: newProgress });
        this.game.heroes = this.game.heroes.map(h => h.id === hero.id ? updatedHero : h);
        
        // Handle different results of advancement
        this.handleAdvancementResult(newDungeon, hero, result, newProgress);
        
        // Update dungeon after handling advancement results
        updateDungeon(dungeon.id, newDungeon);
    }

    /**
     * Handle the result of a hero advancing in a dungeon
     * @param {Dungeon} dungeon - The dungeon being explored
     * @param {Hero} hero - The hero exploring
     * @param {Object} result - The result of advancement
     * @param {number} newProgress - The new progress value
     */
    handleAdvancementResult(dungeon, hero, result, newProgress) {
        if (result.encounter) {
            this.game.log(`${hero.name} encounters a ${result.monster.name} in ${dungeon.name}!`);
            hero.setCombat(true);
        } else if (result.atFinalMonster) {
            this.game.log(`${hero.name} has reached the end of ${dungeon.name} and encounters the final boss!`);
        }

    }

    /**
     * Process healing for heroes
     * @param {number} deltaTime - Time in seconds since the last update
     */
    processHealingHeroes(deltaTime) {
        // Find all healing heroes
        const healingHeroes = this.game.heroes.filter(h => h.status === "healing");
        for (const hero of healingHeroes) {
            this.healHero(hero);
        }
    }

    /**
     * Heal a single hero based on their available resources
     * @param {Hero} hero - The hero to heal
     */
    healHero(hero) {
        if (hero.inventory.monsterParts > 0) {
            this.fastHealHero(hero);
        } else {
            this.normalHealHero(hero);
        }
        
        // If fully healed, set back to idle
        if (hero.health >= hero.maxHealth) {
            this.setHeroToIdle(hero);
        }
    }

    /**
     * Perform fast healing on a hero using monster parts
     * @param {Hero} hero - The hero to heal
     */
    fastHealHero(hero) {
        // Get the updated hero instance from fastHeal
        const updatedHero = hero.fastHeal(1, this.game);
        updateHero(hero.id, updatedHero);
        this.game.log(`${hero.name} spends 1 monster part to heal quickly.`);
    }

    /**
     * Perform normal healing on a hero
     * @param {Hero} hero - The hero to heal
     */
    normalHealHero(hero) {
        // Get the updated hero instance from heal
        const updatedHero = hero.heal(1);
        updateHero(hero.id, updatedHero);
    }

    /**
     * Set a hero to idle status when fully healed
     * @param {Hero} hero - The hero to set to idle
     */
    setHeroToIdle(hero) {
        const idleHero = hero.setStatus("idle");
        updateHero(hero.id, idleHero);
        this.game.log(`${hero.name} has fully recovered and is ready for adventure!`);
    }

    /**
     * Assign a hero to a dungeon for exploration.
     * Sets the hero's status, dungeonId, and adds them to the dungeon's explorer list if not present.
     * @param {Hero} hero - The hero to assign
     * @param {Dungeon} dungeon - The dungeon to explore
     */
    assignHeroToDungeon(hero, dungeon) {
        if (!hero || !dungeon) return;
        // Use setStatus to get a new hero instance with updated status
        const updatedHero = hero.setStatus("exploring", dungeon.id);
        // Replace the hero in the array for Svelte reactivity
        this.game.heroes = this.game.heroes.map(h => h.id === hero.id ? updatedHero : h);
        if (!dungeon.getExplorerProgress(hero.id)) {
            const updatedDungeon = dungeon.addExplorerReactive(hero.id, 0);
            updateDungeon(dungeon.id, updatedDungeon);
        }
        updatedHero.dungeonProgress = 0;
        this.game.log(`${updatedHero.name} is now exploring ${dungeon.name}.`);
    }

    /**
     * Discover a dungeon if the player has enough resources
     * @param {string} dungeonId - The ID of the dungeon to discover
     */
    discoverDungeon(dungeonId) {
        const dungeon = this.game.dungeons.find(d => d.id === dungeonId);
        
        if (!dungeon) {
            this.game.log(`Error: Dungeon ${dungeonId} not found`);
            return;
        }
        
        if (dungeon.discovered) {
            this.game.log(`The ${dungeon.name} has already been discovered.`);
            return;
        }
        
        if (this.game.resources.gold >= dungeon.discoveryCost) {
            this.game.resources.gold -= dungeon.discoveryCost;
            dungeon.discovered = true;
            
            this.game.log(`Your scouts have discovered the ${dungeon.name}!`);
        } else {
            this.game.log(`Not enough gold to discover this location. Need ${dungeon.discoveryCost} gold.`);
        }
    }
}

export { ExplorationSystem };