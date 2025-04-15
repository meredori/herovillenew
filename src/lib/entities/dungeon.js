/**
 * Dungeon.js - Dungeon entity for Heroville
 * 
 * Defines the dungeon entity with properties for exploration and encounters.
 * Supports multiple heroes with individual progression tracking.
 */

import { Monster } from './monster.js';

class Dungeon {
    /**
     * Create a new dungeon
     * @param {Object} config - Configuration for the dungeon
     */
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.discovered = config.discovered || false;
        this.discoveryCost = config.discoveryCost || 0;
        this.difficulty = config.difficulty || 1;
        this.length = config.length || 10;
        this.encounterRate = config.encounterRate || 0.3;
        this.completed = config.completed || false;
        
        // Primary monster type for this dungeon
        this.monsterType = config.monsterType || 'Goblin';
        
        // Variant for the final monster encounter
        if (config.variant) {
            this.variant = config.variant;
        } else {
            this.variant = Monster.getRandomVariant(); 
        }
        
        // Hero progression tracking - maps hero IDs to their progress in this dungeon
        this.explorers = new Map();
    }
    
    /**
     * Add a hero to this dungeon or update their progress
     * @param {string} heroId - The ID of the hero
     * @param {number} progress - Current progress (defaults to 0 for new heroes)
     */
    addExplorer(heroId, progress = 0) {
        this.explorers.set(heroId, {
            progress: progress,
            encounteredFinalMonster: false,
            currentMonster: null,
            finalMonsterDefeated: false
        });
    }
    
    /**
     * Remove a hero from this dungeon
     * @param {string} heroId - The ID of the hero to remove
     */
    removeExplorer(heroId) {
        this.explorers.delete(heroId);
    }

    /**
     * Clean up all explorer-related state for a hero leaving the dungeon.
     * @param {string} heroId - The ID of the hero to clean up
     */
    cleanupExplorer(heroId) {
        this.explorers.delete(heroId);
    }
    
    /**
     * Get a hero's progress in this dungeon
     * @param {string} heroId - The ID of the hero
     * @returns {Object|null} The hero's progress or null if not exploring
     */
    getExplorerProgress(heroId) {
        return this.explorers.get(heroId) || null;
    }
    
    /**
     * Create a monster specific to this dungeon
     * @param {number} [difficulty=null] - Optional difficulty override (defaults to dungeon difficulty)
     * @returns {Monster} A new dungeon-specific monster instance
     */
    createDungeonMonster(difficulty = null) {
        const monsterDifficulty = difficulty || this.difficulty;
        const monster = Monster.createMonster(this.monsterType, monsterDifficulty);
        monster.isVariant = false;
        return monster;
    }
    
    /**
     * Advance a hero's progress in the dungeon
     * @param {string} heroId - The ID of the hero
     * @returns {Object} Result object with encounter information
     */
    advanceExplorer(heroId) {
        const explorer = this.explorers.get(heroId);
        if (!explorer) {
            return { success: false, message: "Hero not found in this dungeon" };
        }
        
        if (explorer.progress >= this.length) {
            // Already at the end, check if final monster is still present
            if (!explorer.currentMonster) {
                // Generate a variant monster for the final encounter
                explorer.currentMonster = Monster.createVariantMonster(
                    this.monsterType,
                    this.difficulty * 1.5,
                    this.variant || Monster.getRandomVariant()
                );
                explorer.currentMonster.isVariant = true;
                explorer.encounteredFinalMonster = true;
                return {
                    success: true,
                    reachedEnd: true,
                    atFinalMonster: true,
                    encounter: true,
                    monster: explorer.currentMonster,
                    message: `Final monster encountered: ${explorer.currentMonster.name}`
                };
            } else {
                // Already at final monster, do not advance
                return {
                    success: true,
                    reachedEnd: true,
                    atFinalMonster: true,
                    encounter: !!explorer.currentMonster,
                    monster: explorer.currentMonster,
                    message: "Already at the end of the dungeon"
                };
            }
        }
        
        // Increment progress
        explorer.progress += 1;
        
        // Check if reached the end (final monster)
        if (explorer.progress >= this.length) {
            explorer.currentMonster = Monster.createVariantMonster(
                this.monsterType,
                this.difficulty * 1.5,
                this.variant || Monster.getRandomVariant()
            );
            explorer.currentMonster.isVariant = true;
            explorer.encounteredFinalMonster = true;
            return {
                success: true,
                reachedEnd: true,
                atFinalMonster: true,
                encounter: true,
                monster: explorer.currentMonster,
                message: `Final monster encountered: ${explorer.currentMonster.name}`
            };
        }
        
        // Check for random encounter
        const encounter = Math.random() < this.encounterRate;
        if (encounter) {
            explorer.currentMonster = this.createDungeonMonster();
            explorer.currentMonster.isVariant = false;
            return {
                success: true,
                reachedEnd: false,
                atFinalMonster: false,
                encounter: true,
                monster: explorer.currentMonster,
                message: `Encountered a ${explorer.currentMonster.name}`
            };
        }
        
        // No encounter
        explorer.currentMonster = null;
        return {
            success: true,
            reachedEnd: false,
            atFinalMonster: false,
            encounter: false,
            message: "Advanced without encounter"
        };
    }
    
    /**
     * Complete an encounter (monster defeated)
     * @param {string} heroId - The ID of the hero
     */
    completeEncounter(heroId) {
        const explorer = this.explorers.get(heroId);
        if (explorer) {
            // If the current monster is a variant (final boss), mark as defeated
            if (explorer.currentMonster && explorer.currentMonster.isVariant) {
                explorer.finalMonsterDefeated = true;
            }
            explorer.currentMonster = null;
        }
    }
    
    /**
     * Mark the dungeon as completed by a hero
     * @param {string} heroId - The ID of the hero who completed the dungeon
     */
    completeDungeon(heroId) {
        this.completed = true;
    }
    
    /**
     * Get the number of heroes currently exploring this dungeon
     * @returns {number} Count of active explorers
     */
    getExplorerCount() {
        return this.explorers.size;
    }
    
    /**
     * Create a serializable object for saving
     * @returns {Object} Plain object representation of this dungeon
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            discovered: this.discovered,
            discoveryCost: this.discoveryCost,
            difficulty: this.difficulty,
            length: this.length,
            encounterRate: this.encounterRate,
            completed: this.completed,
            monsterType: this.monsterType,
            variant: this.variant,
            explorers: Array.from(this.explorers.entries()).map(([heroId, data]) => ({
                heroId,
                progress: data.progress,
                encounteredFinalMonster: data.encounteredFinalMonster,
                finalMonsterDefeated: data.finalMonsterDefeated
            }))
        };
    }
    
    /**
     * Create a Dungeon instance from a saved object
     * @param {Object} data - The saved dungeon data
     * @returns {Dungeon} A new Dungeon instance
     */
    static fromJSON(data) {
        const dungeon = new Dungeon(data);
        
        if (Array.isArray(data.explorers)) {
            data.explorers.forEach(explorer => {
                dungeon.addExplorer(explorer.heroId, explorer.progress);
                if (explorer.encounteredFinalMonster) {
                    const explorerData = dungeon.explorers.get(explorer.heroId);
                    if (explorerData) {
                        explorerData.encounteredFinalMonster = true;
                        explorerData.finalMonsterDefeated = explorer.finalMonsterDefeated || false;
                    }
                }
            });
        }
        
        return dungeon;
    }

    /**
     * Returns a new Dungeon instance with updated explorers map (for Svelte reactivity)
     * @returns {Dungeon} New Dungeon instance with copied properties and explorers
     */
    cloneWithUpdatedExplorers() {
        const clone = new Dungeon({
            id: this.id,
            name: this.name,
            description: this.description,
            discovered: this.discovered,
            discoveryCost: this.discoveryCost,
            difficulty: this.difficulty,
            length: this.length,
            encounterRate: this.encounterRate,
            completed: this.completed,
            monsterType: this.monsterType,
            variant: this.variant
        });
        // Deep copy explorers
        clone.explorers = new Map(Array.from(this.explorers.entries()).map(([k, v]) => [k, { ...v }]));
        return clone;
    }

    /**
     * Add a hero to this dungeon or update their progress (returns a new Dungeon instance)
     * @param {string} heroId - The ID of the hero
     * @param {number} progress - Current progress (defaults to 0 for new heroes)
     * @returns {Dungeon} New Dungeon instance
     */
    addExplorerReactive(heroId, progress = 0) {
        const clone = this.cloneWithUpdatedExplorers();
        clone.explorers.set(heroId, {
            progress: progress,
            encounteredFinalMonster: false,
            currentMonster: null,
            finalMonsterDefeated: false
        });
        return clone;
    }

    /**
     * Remove a hero from this dungeon (returns a new Dungeon instance)
     * @param {string} heroId - The ID of the hero to remove
     * @returns {Dungeon} New Dungeon instance
     */
    removeExplorerReactive(heroId) {
        const clone = this.cloneWithUpdatedExplorers();
        clone.explorers.delete(heroId);
        return clone;
    }

    /**
     * Advance a hero's progress in the dungeon (returns a new Dungeon instance and result)
     * @param {string} heroId - The ID of the hero
     * @returns {{ dungeon: Dungeon, result: Object }}
     */
    advanceExplorerReactive(heroId) {
        const clone = this.cloneWithUpdatedExplorers();
        const explorer = clone.explorers.get(heroId);
        if (!explorer) {
            return { dungeon: clone, result: { success: false, message: "Hero not found in this dungeon" } };
        }
        if (explorer.progress >= clone.length) {
            if (!explorer.currentMonster) {
                explorer.currentMonster = Monster.createVariantMonster(
                    clone.monsterType,
                    clone.difficulty * 1.5,
                    clone.variant || Monster.getRandomVariant()
                );
                explorer.currentMonster.isVariant = true;
                explorer.encounteredFinalMonster = true;
                return {
                    dungeon: clone,
                    result: {
                        success: true,
                        reachedEnd: true,
                        atFinalMonster: true,
                        encounter: true,
                        monster: explorer.currentMonster,
                        message: `Final monster encountered: ${explorer.currentMonster.name}`
                    }
                };
            } else {
                return {
                    dungeon: clone,
                    result: {
                        success: true,
                        reachedEnd: true,
                        atFinalMonster: true,
                        encounter: !!explorer.currentMonster,
                        monster: explorer.currentMonster,
                        message: "Already at the end of the dungeon"
                    }
                };
            }
        }
        explorer.progress += 1;
        if (explorer.progress >= clone.length) {
            explorer.currentMonster = Monster.createVariantMonster(
                clone.monsterType,
                clone.difficulty * 1.5,
                clone.variant || Monster.getRandomVariant()
            );
            explorer.currentMonster.isVariant = true;
            explorer.encounteredFinalMonster = true;
            return {
                dungeon: clone,
                result: {
                    success: true,
                    reachedEnd: true,
                    atFinalMonster: true,
                    encounter: true,
                    monster: explorer.currentMonster,
                    message: `Final monster encountered: ${explorer.currentMonster.name}`
                }
            };
        }
        const encounter = Math.random() < clone.encounterRate;
        if (encounter) {
            explorer.currentMonster = clone.createDungeonMonster();
            explorer.currentMonster.isVariant = false;
            return {
                dungeon: clone,
                result: {
                    success: true,
                    reachedEnd: false,
                    atFinalMonster: false,
                    encounter: true,
                    monster: explorer.currentMonster,
                    message: `Encountered a ${explorer.currentMonster.name}`
                }
            };
        }
        explorer.currentMonster = null;
        return {
            dungeon: clone,
            result: {
                success: true,
                reachedEnd: false,
                atFinalMonster: false,
                encounter: false,
                message: "Advanced without encounter"
            }
        };
    }

    /**
     * Complete an encounter (monster defeated, returns a new Dungeon instance)
     * @param {string} heroId - The ID of the hero
     * @returns {Dungeon} New Dungeon instance
     */
    completeEncounterReactive(heroId) {
        const clone = this.cloneWithUpdatedExplorers();
        const explorer = clone.explorers.get(heroId);
        if (explorer) {
            if (explorer.currentMonster && explorer.currentMonster.isVariant) {
                explorer.finalMonsterDefeated = true;
            }
            explorer.currentMonster = null;
        }
        return clone;
    }

    /**
     * Mark the dungeon as completed by a hero (returns a new Dungeon instance)
     * @param {string} heroId - The ID of the hero who completed the dungeon
     * @returns {Dungeon} New Dungeon instance
     */
    completeDungeonReactive(heroId) {
        const clone = this.cloneWithUpdatedExplorers();
        clone.completed = true;
        return clone;
    }
}

// Export the Dungeon class
export { Dungeon };