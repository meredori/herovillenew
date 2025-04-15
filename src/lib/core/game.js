/**
 * Game.js - Core game engine for Heroville
 * 
 * Handles the main game loop and core game mechanics.
 * Adapted for Svelte from the original JavaScript version.
 */

// Import entities
import { Hero } from '../entities/hero.js';
import { Dungeon } from '../entities/dungeon.js';
import { Monster } from '../entities/monster.js';
import { getConsumableById, Consumables } from '../entities/consumable.js';

// Import subsystems
import { CombatSystem } from './combat.js';
import { SaveLoadSystem } from './saveload.js';
import { ExplorationSystem } from './exploration.js';
import { updateDungeon } from './gameStore.js';

class Game {
    constructor() {
        this.lastTimestamp = 0;
        this.running = false;
        this.accumulatedTime = 0;
        this.tickRate = 1000; // Update game state every 1 second
        
        // Game state
        this.resources = {};
        this.buildings = [];
        this.heroes = [];
        this.dungeons = [];
        this.logs = []; // Array to store game logs
        this.potions = {}; // Town's potion inventory
        
        // Initialize subsystems
        this.combatSystem = new CombatSystem(this);
        this.saveLoadSystem = new SaveLoadSystem(this);
        this.explorationSystem = new ExplorationSystem(this);
    }

    /**
     * Initialize the game
     */
    init() {
        // Load saved game if available
        const savedGame = this.saveLoadSystem.loadGame();
        if (savedGame) {
            this.saveLoadSystem.loadGameState(savedGame);
            this.log("Game loaded successfully");
        } else {
            // Initialize new game
            this.initNewGame();
            this.log("New game started");
        }

        // Start the game loop
        this.start();
    }

    /**
     * Initialize a new game with starting values
     */
    initNewGame() {
        // Set up initial resources
        this.resources = {
            materials: 0,    // Gathered resource
            monsterParts: 0, // Looted resource
            gold: 0          // Currency resource
        };
        
        // Set up initial buildings
        this.buildings = [
            {
                id: 'tent',
                name: 'Tent',
                level: 0,
                description: 'A simple shelter for heroes to rest in.',
                baseCost: 5,  // Base cost in materials
            }
        ];
        
        // Set up initial heroes
        this.heroes = [];
        
        // Set up initial dungeons (all undiscovered initially)
        this.dungeons = [
            new Dungeon({
                id: 'cave',
                name: 'Mysterious Cave',
                description: 'A dark cave with unknown mysteries inside.',
                discovered: false,
                discoveryCost: 0, // First dungeon is free
                difficulty: 1,
                length: 10,
                encounterRate: 0.3,
                monsterType: 'Bat',
                variant: { name: 'Giant', isPrefix: true, healthMultiplier: 1.5, damageMultiplier: 1.3 }
            }),
            new Dungeon({
                id: 'forest',
                name: 'Enchanted Forest',
                description: 'A forest filled with magical creatures.',
                discovered: false,
                discoveryCost: 20, // Cost in gold
                difficulty: 2,
                length: 15,
                encounterRate: 0.4,
                monsterType: 'Wolf',
                variant: { name: 'Alpha', isPrefix: false, healthMultiplier: 2.0, damageMultiplier: 1.6 }
            }),
            new Dungeon({
                id: 'crypt',
                name: 'Ancient Crypt',
                description: 'A crypt filled with the undead and forgotten treasures.',
                discovered: false,
                discoveryCost: 50, // Cost in gold
                difficulty: 3,
                length: 20,
                encounterRate: 0.5,
                monsterType: 'Skeleton',
                variant: { name: 'King', isPrefix: true, healthMultiplier: 2.5, damageMultiplier: 2.0 }
            }),
            new Dungeon({
                id: 'sewer',
                name: 'Forgotten Sewers',
                description: 'Dark, damp tunnels running beneath the city, infested with vermin.',
                discovered: false,
                discoveryCost: 75, // Cost in gold
                difficulty: 4,
                length: 25,
                encounterRate: 0.6,
                monsterType: 'Rat',
                variant: { name: 'King', isPrefix: true, healthMultiplier: 3.0, damageMultiplier: 2.2 }
            }),
            new Dungeon({
                id: 'mine',
                name: 'Abandoned Mine',
                description: 'A long-forgotten mine with unstable passages and strange creatures.',
                discovered: false,
                discoveryCost: 100, // Cost in gold
                difficulty: 5,
                length: 30,
                encounterRate: 0.5,
                monsterType: 'Spider',
                variant: { name: "Matriarch", isPrefix: false, healthMultiplier: 3.2, damageMultiplier: 2.5 }
            })
        ];
    }

    /**
     * Gather materials when the button is clicked
     */
    gatherMaterials() {
        this.resources.materials += 1;
        this.log("You gathered 1 material");
    }

    /**
     * Start the game loop
     */
    start() {
        this.running = true;
        this.lastTimestamp = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.running = false;
    }

    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp from requestAnimationFrame
     */
    gameLoop(timestamp) {
        if (!this.running) return;

        // Calculate delta time in milliseconds
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        // Accumulate time until we reach our tick rate
        this.accumulatedTime += deltaTime;
        
        // Update game state based on tick rate
        if (this.accumulatedTime >= this.tickRate) {
            // Calculate how many ticks to process
            const ticksToProcess = Math.floor(this.accumulatedTime / this.tickRate);
            
            // Update game state for each tick
            for (let i = 0; i < ticksToProcess; i++) {
                this.update(this.tickRate / 1000); // Convert to seconds for game logic
            }
            
            // Remove processed time
            this.accumulatedTime -= ticksToProcess * this.tickRate;
        }

        // Handle auto-save through the save/load system
        this.saveLoadSystem.update(deltaTime);

        // Continue the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Update game state for a single tick
     * @param {number} deltaTime - Time in seconds since the last update
     */
    update(deltaTime) {
        // Process combat rounds for heroes in combat
        this.combatSystem.processCombatRounds();
        
        // Process automatic dungeon exploration
        this.explorationSystem.processAutomaticDungeonExploration();
        
        // Process healing heroes
        this.explorationSystem.processHealingHeroes(deltaTime);
        
        // Process hero decision-making for idle heroes
        this.processHeroDecisions();
    }

    /**
     * Process decisions for all idle heroes
     * Allows heroes to automatically decide what to do next
     */
    processHeroDecisions() {
        // Find all idle heroes
        const idleHeroes = this.heroes.filter(h => h.status === "idle");
        
        // Let each idle hero decide their next action
        for (const hero of idleHeroes) {
            const decision = hero.decideNextAction(this.dungeons, this);

            // If the hero's status or properties changed, update the hero in the array
            if (decision.action !== hero.status || decision.action !== "idle") {
                // If decideNextAction returned a new hero object, use it; otherwise, update status
                let updatedHero = hero;
                if (typeof hero.setStatus === 'function' && decision.action !== hero.status) {
                    updatedHero = hero.setStatus(decision.action, decision.target);
                }
                // Replace the hero in the array
                this.heroes = this.heroes.map(h => h.id === hero.id ? updatedHero : h);
                
                this.log(`${hero.name} decided to ${decision.action === "exploring" ? 
                    "explore " + this.dungeons.find(d => d.id === decision.target)?.name : 
                    decision.action}`);
            }
        }

        // --- FIX: Unstick heroes from shopping ---
        // Find all heroes stuck in shopping and let them try to buy a potion
        for (const hero of this.heroes) {
            if (hero.status === "shopping") {
                // Try to buy a potion if possible
                const availablePotions = Consumables.filter(c => c.type === 'potion');
                let bought = false;
                for (const potion of availablePotions) {
                    if (this.potions[potion.id] > 0 && hero.inventory.gold >= potion.salePrice) {
                        // Transaction: hero pays gold, town receives gold, hero gets potion, town loses potion
                        hero.inventory.gold -= potion.salePrice;
                        this.resources.gold += potion.salePrice;
                        this.potions[potion.id] -= 1;
                        if (!hero.inventory.potions) hero.inventory.potions = {};
                        hero.inventory.potions[potion.id] = (hero.inventory.potions[potion.id] || 0) + 1;
                        this.log(`${hero.name} bought a ${potion.name} for ${potion.salePrice} gold.`);
                        bought = true;
                        break; // Only buy one per shopping session
                    }
                }
                // After shopping, set hero to idle and mark as shopped
                hero.status = "idle";
                hero.hasShoppedForUpgrades = true;
                if (!bought) {
                    this.log(`${hero.name} finished shopping and is now idle.`);
                }
                // --- FIX: Replace hero in array to trigger reactivity ---
                this.heroes = this.heroes.map(h => h.id === hero.id ? hero : h);
            }
        }
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
        const building = this.buildings.find(b => b.id === buildingId);
        
        if (!building) {
            this.log(`Error: Building ${buildingId} not found`);
            return;
        }
        
        const upgradeCost = this.calculateBuildingUpgradeCost(building);
        
        if (this.resources.materials >= upgradeCost) {
            this.resources.materials -= upgradeCost;
            building.level += 1;
            
            this.log(`Upgraded ${building.name} to level ${building.level}`);
            
            // If this is the tent, spawn a hero with every upgrade
            if (buildingId === 'tent') {
                this.spawnHero();
            }
        } else {
            this.log(`Not enough materials to upgrade ${building.name}. Need ${upgradeCost} materials.`);
        }
    }
    
    /**
     * Spawn a new hero
     * @returns {Hero} The newly spawned hero
     */
    spawnHero() {
        const hero = new Hero();
        this.heroes.push(hero);
        this.log(`A new hero has appeared: ${hero.name}!`);
        return hero;
    }

    /**
     * Unlock the Apothecary building when first monster part is gained
     */
    unlockApothecaryBuilding() {
        if (!this.buildings.some(b => b.id === 'apothecary')) {
            this.buildings.push({
                id: 'apothecary',
                name: 'Apothecary',
                level: 0,
                description: 'A place to craft potions and remedies. (Placeholder)',
                baseCost: 10, // Cost in materials
                unlocked: true
            });
            this.log('The Apothecary is now available for construction!');
        }
    }

    /**
     * Log a message to the game log
     * @param {string} message - The message to log
     */
    log(message) {
        this.logs.unshift({
            id: Date.now() + '_' + Math.floor(Math.random() * 1000000), // Ensures uniqueness
            text: message,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Keep log to a reasonable size
        if (this.logs.length > 100) {
            this.logs.pop();
        }
    }
}
const gameInstance = new Game();
const combatSystem = gameInstance.combatSystem;
// Export the Game class
export { Game, gameInstance, combatSystem };