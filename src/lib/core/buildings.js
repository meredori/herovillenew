/**
 * buildings.js - Building management system for Heroville
 * 
 * Handles building upgrades, costs, and unlocking new building types.
 */

import { Hero } from '../entities/hero.js';

class Buildings {
    constructor(game) {
        this.game = game;
    }

    /**
     * Calculate the upgrade cost for a building
     * @param {Object} building - The building to calculate the cost for
     * @returns {number} - The cost to upgrade the building
     */
    calculateBuildingUpgradeCost(building) {
        // Special exponential scaling for tent to make heroes progressively harder to get
        if (building.id === 'tent') {
            // Use a power of 10 scaling (5, 50, 500, etc.)
            return Math.floor(building.baseCost * Math.pow(10, building.level));
        } else {
            // For other buildings, use standard formula if they have costMultiplier
            return building.costMultiplier ? 
                Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.level)) :
                building.baseCost;
        }
    }

    /**
     * Upgrade a building if the player has enough resources
     * @param {string} buildingId - The ID of the building to upgrade
     */
    upgradeBuilding(buildingId) {
        const building = this.game.buildings.find(b => b.id === buildingId);
        
        if (!building) {
            this.game.log(`Error: Building ${buildingId} not found`);
            return;
        }
        
        const upgradeCost = this.calculateBuildingUpgradeCost(building);
        
        if (this.game.resources.materials >= upgradeCost) {
            this.game.resources.materials -= upgradeCost;
            building.level += 1;
            
            this.game.log(`Upgraded ${building.name} to level ${building.level}`);
            
            // If this is the tent, spawn a hero with every upgrade
            if (buildingId === 'tent') {
                this.spawnHero();
            }
        } else {
            this.game.log(`Not enough materials to upgrade ${building.name}. Need ${upgradeCost} materials.`);
        }
    }
    
    /**
     * Spawn a new hero
     * @returns {Hero} The newly spawned hero
     */
    spawnHero() {
        const hero = new Hero();
        this.game.heroes.push(hero);
        this.game.log(`A new hero has appeared: ${hero.name}!`);
        return hero;
    }

    /**
     * Unlock the Apothecary building when first monster part is gained
     */
    unlockApothecaryBuilding() {
        if (!this.game.buildings.some(b => b.id === 'apothecary')) {
            this.game.buildings.push({
                id: 'apothecary',
                name: 'Apothecary',
                level: 0,
                description: 'A place to craft potions and remedies. (Placeholder)',
                baseCost: 10, // Cost in materials
                unlocked: true
            });
            this.game.log('The Apothecary is now available for construction!');
        }
    }

    /**
     * Unlock the Blacksmith building when a hero reaches level 2
     */
    unlockBlacksmithBuilding() {
        if (!this.game.buildings.some(b => b.id === 'blacksmith')) {
            this.game.buildings.push({
                id: 'blacksmith',
                name: 'Blacksmith',
                level: 0,
                description: 'A forge where weapons can be crafted and repaired.',
                baseCost: 15, // Cost in materials
                unlocked: true
            });
            this.game.log('The Blacksmith is now available for construction!');
        }
    }
}

export { Buildings };