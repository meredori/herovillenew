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
import { getConsumableById, Consumables, getMaxStack, DEFAULT_MAX_POTIONS } from '../entities/consumable.js';

// Import subsystems
import { CombatSystem } from './combat.js';
import { SaveLoadSystem } from './saveload.js';
import { ExplorationSystem } from './exploration.js';
import { Buildings } from './buildings.js';
import { Shopping } from './shopping.js';
import { Logging } from './logging.js';
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
        this.weapons = {}; // Town's weapon inventory
        
        // Initialize subsystems
        this.combatSystem = new CombatSystem(this);
        this.saveLoadSystem = new SaveLoadSystem(this);
        this.explorationSystem = new ExplorationSystem(this);
        this.buildingSystem = new Buildings(this);
        this.shoppingSystem = new Shopping(this);
        this.loggingSystem = new Logging(this);
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
        
        // Reset town inventories
        this.potions = {};
        this.weapons = {};
        
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
                encounterRate: 0.3,
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
        
        // Process shopping for heroes
        this.shoppingSystem.processHeroShopping();
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
    }

    /**
     * Calculate the upgrade cost for a building
     * @param {Object} building - The building to calculate the cost for
     * @returns {number} - The cost to upgrade the building
     */
    calculateBuildingUpgradeCost(building) {
        return this.buildingSystem.calculateBuildingUpgradeCost(building);
    }

    /**
     * Upgrade a building if the player has enough resources
     * @param {string} buildingId - The ID of the building to upgrade
     */
    upgradeBuilding(buildingId) {
        this.buildingSystem.upgradeBuilding(buildingId);
    }
    
    /**
     * Spawn a new hero
     * @returns {Hero} The newly spawned hero
     */
    spawnHero() {
        return this.buildingSystem.spawnHero();
    }

    /**
     * Unlock the Apothecary building when first monster part is gained
     */
    unlockApothecaryBuilding() {
        this.buildingSystem.unlockApothecaryBuilding();
    }

    /**
     * Unlock the Blacksmith building when a hero reaches level 2
     */
    unlockBlacksmithBuilding() {
        this.buildingSystem.unlockBlacksmithBuilding();
    }

    /**
     * Log a message to the game log
     * @param {string} message - The message to log
     */
    log(message) {
        this.loggingSystem.log(message);
    }
}
const gameInstance = new Game();
const combatSystem = gameInstance.combatSystem;
// Export the Game class
export { Game, gameInstance, combatSystem };