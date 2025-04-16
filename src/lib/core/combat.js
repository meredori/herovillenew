/**
 * Combat.js - Combat system for Heroville
 * 
 * Handles all combat-related functionality including:
 * - Processing combat rounds between heroes and monsters
 * - Managing combat rewards and consequences
 */

import { Monster } from '../entities/monster.js';
import { updateDungeon, updateHero } from './gameStore.js';
import { getMaxStack, getConsumableById } from '../entities/consumable.js';

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
     * If the monster's max hit can defeat the hero, the hero will use a potion (if available) to heal based on the potion's effectAmount instead of attacking.
     * @param {Hero} hero - The hero in combat
     * @param {Monster} monster - The monster being fought
     * @returns {Object} { action: 'attack' | 'heal', damage: number, healed: number, updatedHero: Hero }
     */
    heroTurn(hero, monster) {
        const monsterMaxHit = monster.maxDamage;
        
        // Check if we have any health potions to use (use health_potion consumable ID)
        const hasPotions = hero.inventory?.potions && 
                          typeof hero.inventory.potions === 'object' && 
                          hero.inventory.potions.health_potion > 0;
        
        // If monster's max hit can defeat the hero, try to heal
        if (monsterMaxHit > hero.health && hasPotions) {
            // Get the health potion's effect amount (percentage of max health)
            const healthPotion = getConsumableById('health_potion');
            const healPercentage = healthPotion ? healthPotion.effectAmount : 0.2; // Default to 20% if not found
            const healAmount = Math.floor(hero.maxHealth * healPercentage);
            
            // Create a new hero instance with updated health using heal method
            let updatedHero = hero.heal(healAmount);
            console.log(`Using potion to heal ${healAmount} health. New health: ${updatedHero.health}`);
            
            // Create a new inventory object with decremented potions
            const newPotions = { ...updatedHero.inventory.potions };
            newPotions.health_potion = (newPotions.health_potion || 0) - 1;
            
            // Create final updated hero with new inventory
            const HeroClass = hero.constructor;
            updatedHero = new HeroClass(updatedHero.name);
            Object.assign(updatedHero, hero, { 
                health: updatedHero.health, 
                inventory: {
                    ...updatedHero.inventory,
                    potions: newPotions
                }
            });
            
            return { 
                action: 'heal', 
                damage: 0, 
                healed: healAmount,
                updatedHero
            };
        } else {
            // Attack
            const heroDamage = hero.calculateDamage();
            monster.takeDamage(heroDamage);
            
            // NO LONGER reduce weapon durability here, as we'll do it at the end of combat
            return { 
                action: 'attack', 
                damage: heroDamage, 
                healed: 0,
                updatedHero: hero 
            };
        }
    }

    /**
     * Handles the monster's turn in combat
     * @param {Hero} hero - The hero in combat
     * @param {Monster} monster - The monster attacking
     * @returns {Object} { damage: number, updatedHero: Hero }
     */
    monsterTurn(hero, monster) {
        const monsterDamage = monster.calculateDamage();
        const damagedHero = hero.takeDamage(monsterDamage);
        
        return {
            damage: monsterDamage,
            updatedHero: damagedHero
        };
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
        
        // Log first round of combat only
        if (isFirstRound) {
            this.game.log(`${hero.name} engages in combat with a ${monster.name}!`);
        }
        
        // Hero's turn
        const heroAction = this.heroTurn(hero, monster);
        let currentHero = heroAction.updatedHero; // Use the updated hero from heroTurn
        
        // Check if weapon broke during this turn
        if (currentHero.weaponBroke) {
            // Remove the weapon from equipment
            currentHero.equipment.weapon = null;
            delete currentHero.weaponBroke; // Clear the flag
            this.game.log(`${hero.name}'s weapon broke during combat!`);
        }
        
        // Only log potion use, skip attack messages
        if (heroAction.action === 'heal') {
            this.game.log(`${hero.name} uses a potion to heal for ${heroAction.healed} health!`);
            updateHero(hero.id, currentHero);
        } else {
            // No longer log each attack
            updateDungeon(dungeon.id, dungeon);
        }
        
        // Check if monster is defeated
        if (monster.isDefeated()) {
            this.handleMonsterDefeat(dungeon, hero, monster, currentHero);
            return;
        }
        
        // Monster attacks
        const monsterAction = this.monsterTurn(currentHero, monster);
        currentHero = monsterAction.updatedHero;
        
        // No longer log monster attacks
        updateHero(hero.id, currentHero);
        updateDungeon(dungeon.id, dungeon);
        
        // Check if hero is defeated
        if (currentHero.health <= 0) {
            this.handleHeroDefeat(dungeon, currentHero, explorerData);
        }
    }

    /**
     * Handle monster defeat logic
     * @param {Dungeon} dungeon - The dungeon where combat occurs
     * @param {Hero} hero - The hero in combat
     * @param {Monster} monster - The defeated monster
     * @param {Hero} currentHero - The current hero state
     */
    handleMonsterDefeat(dungeon, hero, monster, currentHero) {
        currentHero.setCombat(false);
        // Use reactive dungeon update for encounter completion
        const updatedDungeon = dungeon.completeEncounterReactive(hero.id);
        this.replaceDungeon(updatedDungeon);
        
        // Reduce weapon durability once per completed fight
        if (currentHero.equipment.weapon) {
            currentHero.equipment.weapon.durability = Math.max(0, currentHero.equipment.weapon.durability - 1);
            
            // Check if weapon broke after combat
            if (currentHero.equipment.weapon.durability <= 0) {
                this.game.log(`${currentHero.name}'s ${currentHero.equipment.weapon.name} broke after defeating the ${monster.name}!`);
                currentHero.equipment.weapon = null;
            }
        }
        
        // Rewards: use isVariant to determine loot
        let expGained, goldGained, partsGained;
        if (monster.isVariant) {
            expGained = 50 * dungeon.difficulty;
            goldGained = dungeon.difficulty;
            partsGained = 0;
            this.awardLoot(currentHero, goldGained, partsGained);
            updatedDungeon.completed = true;
            // Clean up explorer state and reset hero after final boss
            const cleanedDungeon = updatedDungeon.removeExplorerReactive(hero.id);
            updateDungeon(dungeon.id, cleanedDungeon);
            currentHero.resetDungeonProgress("victory", false, this.game, cleanedDungeon);
            updateHero(hero.id, currentHero);
            return;
        } else {
            expGained = 10 * dungeon.difficulty;
            goldGained = 0;
            partsGained = monster.level;
            this.awardLoot(currentHero, goldGained, partsGained);
            
            // Ensure hero can continue exploring after combat
            const explorerData = updatedDungeon.getExplorerProgress(hero.id);
            if (explorerData) {
                delete explorerData.combatRound;
                explorerData.currentMonster = null;
            }
            updateDungeon(dungeon.id, updatedDungeon);
        }
        
        // Add experience and check for level up
        const updatedHero = currentHero.addExperience(expGained);
        
        // If hero leveled up to level 2 or higher, unlock blacksmith
        if (updatedHero.level >= 2 && currentHero.level < 2) {
            this.game.unlockBlacksmithBuilding();
        }
        
        updateHero(hero.id, updatedHero);
        
        this.game.log(`${hero.name} defeats the ${monster.name}!`);
        this.game.log(`Gained: ${expGained} experience, ${goldGained} gold, and ${partsGained} monster parts.`);
        
        if (updatedHero.level > currentHero.level) {
            this.game.log(`${updatedHero.name} has leveled up to level ${updatedHero.level}!`);
        }
        
        // Reset combat round tracker in the explorer data
        const explorerData = updatedDungeon.getExplorerProgress(hero.id);
        if (explorerData) {
            delete explorerData.combatRound;
        }
    }

    /**
     * Handle hero defeat logic
     * @param {Dungeon} dungeon - The dungeon where combat occurs
     * @param {Hero} hero - The defeated hero
     * @param {Object} explorerData - The explorer data
     */
    handleHeroDefeat(dungeon, hero, explorerData) {
        hero.resetDungeonProgress("defeat", true, this.game, dungeon);
        // Remove hero from dungeon's explorer tracking (reactively)
        const updatedDungeon = dungeon.removeExplorerReactive(hero.id);
        updateDungeon(dungeon.id, updatedDungeon);
        
        // Reset combat round tracker
        delete explorerData.combatRound;
        // Update hero for reactivity after defeat
        updateHero(hero.id, hero);
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
     * Replace dungeon in the dungeons array to trigger reactivity
     * @param {Dungeon} dungeon - The dungeon to replace
     */
    replaceDungeon(dungeon) {
        this.game.dungeons = this.game.dungeons.map(d => d.id === dungeon.id ? dungeon : d);
    }
}

export { CombatSystem };