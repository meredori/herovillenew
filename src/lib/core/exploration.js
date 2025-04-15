/**
 * Exploration.js - Dungeon exploration system for Heroville
 * 
 * Handles all dungeon exploration functionality including:
 * - Advancing heroes through dungeons
 * - Managing encounters
 * - Handling dungeon completion
 */

import { updateDungeon, updateHero } from './gameStore.js';

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
                let updatedDungeon = dungeon;
                
                // Check if the hero has encountered the final monster
                let explorerProgress = dungeon.getExplorerProgress(hero.id);
                
                // If hero isn't registered in the dungeon yet, add them (reactively)
                if (!explorerProgress) {
                    updatedDungeon = dungeon.addExplorerReactive(hero.id, hero.dungeonProgress || 0);
                    updateDungeon(dungeon.id, updatedDungeon);
                    explorerProgress = updatedDungeon.getExplorerProgress(hero.id);
                }
                
                // Get updated progress
                const progress = explorerProgress;
                
                // Handle exploration based on progress
                if (progress.encounteredFinalMonster) {
                    if (progress.currentMonster && !hero.inCombat) {
                        hero.setCombat(true);
                        this.game.log(`${hero.name} prepares to fight the final boss in ${dungeon.name}!`);
                    }
                    if (progress.finalMonsterDefeated && !hero.inCombat) {
                        updatedDungeon = updatedDungeon.removeExplorerReactive(hero.id);
                        updateDungeon(dungeon.id, updatedDungeon);
                        hero.resetDungeonProgress("victory", false, this.game, updatedDungeon);
                    }
                } else if (progress.currentMonster) {
                    if (!hero.inCombat) {
                        hero.setCombat(true);
                        this.game.log(`${hero.name} faces a ${progress.currentMonster.name}!`);
                    }
                } else {
                    // Ready to advance (reactively)
                    const { dungeon: newDungeon, result } = updatedDungeon.advanceExplorerReactive(hero.id);
                    updateDungeon(dungeon.id, newDungeon);
                    const newProgress = newDungeon.getExplorerProgress(hero.id)?.progress || 0;
                    // Replace hero in array for Svelte reactivity, preserving Hero class
                    const HeroClass = hero.constructor;
                    const updatedHero = new HeroClass(hero.name);
                    Object.assign(updatedHero, hero, { dungeonProgress: newProgress });
                    this.game.heroes = this.game.heroes.map(h => h.id === hero.id ? updatedHero : h);
                    
                    if (result.encounter) {
                        this.game.log(`${hero.name} encounters a ${result.monster.name} in ${dungeon.name}!`);
                        hero.setCombat(true);
                    } else if (result.atFinalMonster) {
                        this.game.log(`${hero.name} has reached the end of ${dungeon.name} and encounters the final boss!`);
                    } else {
                        if (Math.random() < 0.2) {
                            this.game.log(`${hero.name} advances through ${dungeon.name} (${newProgress}/${dungeon.length}).`);
                        }
                    }
                }
            }
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
            if (hero.inventory.monsterParts > 0) {
                // Use the returned instance from fastHeal
                const healedHero = hero.fastHeal(1, this.game);
                updateHero(hero.id, { ...healedHero });
                this.game.log(`${hero.name} spends 1 monster part to heal quickly.`);
            } else {
                // Use the returned instance from heal
                const healedHero = hero.heal(1);
                updateHero(hero.id, { ...healedHero });
            }
            // If fully healed, set back to idle
            if (hero.health >= hero.maxHealth) {
                const idleHero = hero.setStatus("idle");
                updateHero(hero.id, { ...idleHero });
                this.game.log(`${hero.name} has fully recovered and is ready for adventure!`);
            }
        }
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