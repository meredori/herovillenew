/**
 * shopping.js - Shopping system for Heroville
 * 
 * Handles hero purchasing and repair of weapons and consumables
 */

import { Consumables, getMaxStack, DEFAULT_MAX_POTIONS } from '../entities/consumable.js';

class Shopping {
    constructor(game) {
        this.game = game;
    }

    /**
     * Process shopping for heroes
     * Handles weapon purchases, repairs, and potion purchases
     */
    processHeroShopping() {
        // Process shopping heroes: handle weapon purchases, repairs and potion shopping
        const shoppingHeroes = this.game.heroes.filter(h => h.status === "shopping");
        
        for (const hero of shoppingHeroes) {
            let bought = false;
            let shoppingLog = [];
            
            // First: Check if we should buy a weapon from town inventory
            if (this.game.buildings.some(b => b.id === 'blacksmith' && b.level > 0)) {
                this.processWeaponShopping(hero, shoppingLog).then(result => {
                    bought = bought || result;
                }).catch(error => {
                    console.error("Error processing weapon shopping:", error);
                });
            }
            
            // Next: Check for potions from town inventory
            const potionBought = this.processPotionShopping(hero, shoppingLog);
            bought = bought || potionBought;
            
            // After shopping, set hero to idle and mark as shopped
            hero.status = "idle";
            hero.hasShoppedForUpgrades = true;
            
            // Log all shopping activity
            if (shoppingLog.length > 0) {
                for (const log of shoppingLog) {
                    this.game.log(log);
                }
                this.game.log(`${hero.name} finished shopping and is now idle.`);
            } else if (!bought) {
                this.game.log(`${hero.name} couldn't find anything to buy and is now idle.`);
            }
            
            // Replace hero in array to trigger reactivity
            this.game.heroes = this.game.heroes.map(h => h.id === hero.id ? hero : h);
        }
    }

    /**
     * Process weapon purchases and repairs for a hero
     * @param {Hero} hero - The hero shopping
     * @param {Array} shoppingLog - Array to add shopping logs to
     * @returns {Promise<boolean>} - Promise that resolves to true if anything was bought
     */
    async processWeaponShopping(hero, shoppingLog) {
        let bought = false;
        
        try {
            // Dynamic import to avoid circular dependencies
            const { getAvailableWeapons, createWeapon, isWeaponBetter } = await import('../entities/weapon.js');
            
            const blacksmithLevel = this.game.buildings.find(b => b.id === 'blacksmith').level;
            const availableWeapons = getAvailableWeapons(blacksmithLevel);
            
            // First try to find the best weapon from the town's inventory
            let bestWeaponFromStock = null;
            
            for (const weaponTemplate of availableWeapons) {
                // Check if town has this weapon in stock and hero can afford it
                if (this.game.weapons[weaponTemplate.id] && this.game.weapons[weaponTemplate.id] > 0 && 
                    hero.inventory.gold >= weaponTemplate.salePrice) {
                    
                    if (!bestWeaponFromStock || isWeaponBetter(weaponTemplate, bestWeaponFromStock)) {
                        bestWeaponFromStock = weaponTemplate;
                    }
                }
            }
            
            // If found a weapon in stock that's better than current, buy it
            if (bestWeaponFromStock && isWeaponBetter(bestWeaponFromStock, hero.equipment.weapon)) {
                // Transaction: hero pays gold, town receives gold, hero gets weapon, town loses weapon
                hero.inventory.gold -= bestWeaponFromStock.salePrice;
                this.game.resources.gold += bestWeaponFromStock.salePrice;
                this.game.weapons[bestWeaponFromStock.id] -= 1;
                
                // Create a new weapon instance with full durability
                hero.equipment.weapon = createWeapon(bestWeaponFromStock.id);
                
                shoppingLog.push(`${hero.name} bought a ${bestWeaponFromStock.name} for ${bestWeaponFromStock.salePrice} gold.`);
                bought = true;
            }
            
            // Get the hero's decision to find the target dungeon
            const decision = hero.decideNextAction(this.game.dungeons, this.game);
            
            // Next: Check if we need to repair the current weapon
            if (hero.equipment.weapon && decision.bestDungeon) {
                // Import the calculation function to get the repair cost
                const { calculateWeaponRepairCost } = await import('../entities/weapon.js');
                
                // Get repair cost
                const repairCost = calculateWeaponRepairCost(hero.equipment.weapon);
                
                // For a dungeon, we'd like the weapon to have at least the dungeon length in durability
                const desiredDurability = decision.bestDungeon.length;
                
                if (hero.equipment.weapon.durability < desiredDurability && hero.inventory.gold >= repairCost) {
                    // Calculate number of points to repair (don't exceed max durability)
                    const pointsToRepair = Math.min(
                        desiredDurability - hero.equipment.weapon.durability,
                        hero.equipment.weapon.maxDurability - hero.equipment.weapon.durability
                    );
                    
                    if (pointsToRepair > 0) {
                        hero.inventory.gold -= repairCost;
                        this.game.resources.gold += repairCost;
                        hero.equipment.weapon.durability += pointsToRepair;
                        
                        shoppingLog.push(`${hero.name} repaired their ${hero.equipment.weapon.name} for ${repairCost} gold.`);
                        bought = true;
                    }
                }
            }
        } catch (error) {
            console.error("Error in weapon shopping:", error);
            throw error;
        }
        
        return bought;
    }

    /**
     * Process potion purchases for a hero
     * @param {Hero} hero - The hero shopping
     * @param {Array} shoppingLog - Array to add shopping logs to
     * @returns {boolean} - True if anything was bought
     */
    processPotionShopping(hero, shoppingLog) {
        let bought = false;
        const availablePotions = Consumables.filter(c => c.type === 'potion');
        let canContinueShopping = true;
        
        // Keep buying potions until they can't buy any more
        while (canContinueShopping) {
            canContinueShopping = false; // Assume we can't buy more unless proven otherwise
            
            for (const potion of availablePotions) {
                // Calculate total potions the hero currently has
                let totalPotions = 0;
                if (hero.inventory.potions) {
                    if (typeof hero.inventory.potions === 'object') {
                        totalPotions = Object.values(hero.inventory.potions)
                            .reduce((sum, quantity) => sum + (quantity || 0), 0);
                    } else if (typeof hero.inventory.potions === 'number') {
                        totalPotions = hero.inventory.potions;
                    }
                }
                
                // Only buy if below the potion limit
                const maxPotions = getMaxStack(potion.id) || DEFAULT_MAX_POTIONS;
                if (totalPotions < maxPotions && this.game.potions[potion.id] > 0 && hero.inventory.gold >= potion.salePrice) {
                    // Transaction: hero pays gold, town receives gold, hero gets potion, town loses potion
                    hero.inventory.gold -= potion.salePrice;
                    this.game.resources.gold += potion.salePrice;
                    this.game.potions[potion.id] -= 1;
                    if (!hero.inventory.potions) hero.inventory.potions = {};
                    hero.inventory.potions[potion.id] = (hero.inventory.potions[potion.id] || 0) + 1;
                    
                    shoppingLog.push(`${hero.name} bought a ${potion.name} for ${potion.salePrice} gold.`);
                    bought = true;
                    canContinueShopping = true; // We might be able to buy more
                    break; // Try to buy more in the next iteration
                }
            }
        }
        
        return bought;
    }
}

export { Shopping };