/**
 * SaveLoad.js - Game save/load system for Heroville
 * 
 * Handles saving and loading game state to/from local storage
 */
import { Hero } from '../entities/hero.js';
import { Dungeon } from '../entities/dungeon.js';

class SaveLoadSystem {
    constructor(game) {
        this.game = game;
        this.autoSaveInterval = 60000; // Auto-save every 60 seconds
        this.timeSinceLastAutoSave = 0;
    }

    /**
     * Update auto-save timer
     * @param {number} deltaTime - Time in milliseconds since last update
     */
    update(deltaTime) {
        this.timeSinceLastAutoSave += deltaTime;
        
        if (this.timeSinceLastAutoSave >= this.autoSaveInterval) {
            this.autoSave();
            this.timeSinceLastAutoSave = 0;
        }
    }

    /**
     * Auto-save the game
     */
    autoSave() {
        this.saveGame();
        // Don't log auto-saves to avoid cluttering the log
    }

    /**
     * Save the current game state to local storage
     */
    saveGame() {
        try {
            // Create a simplified game state object for saving
            const saveData = {
                resources: this.game.resources,
                buildings: this.game.buildings,
                heroes: this.serializeHeroes(),
                dungeons: this.serializeDungeons(),
                potions: this.game.potions, // Save potions inventory
                timestamp: Date.now()
            };
            
            // Save to local storage
            localStorage.setItem('heroville_save', JSON.stringify(saveData));
            
            return true;
        } catch (error) {
            console.error("Failed to save game:", error);
            this.game.log("Error saving game: " + error.message);
            return false;
        }
    }

    /**
     * Load a saved game from local storage
     * @returns {Object|null} The loaded game data or null if no save exists
     */
    loadGame() {
        try {
            const savedData = localStorage.getItem('heroville_save');
            
            if (!savedData) {
                return null;
            }
            
            return JSON.parse(savedData);
        } catch (error) {
            console.error("Failed to load game:", error);
            this.game.log("Error loading game: " + error.message);
            return null;
        }
    }

    /**
     * Load game state from a saved data object
     * @param {Object} savedGame - The saved game data
     */
    loadGameState(savedGame) {
        // Restore resources
        this.game.resources = savedGame.resources || {
            materials: 0,
            monsterParts: 0,
            gold: 0
        };
        
        // Restore buildings
        this.game.buildings = savedGame.buildings || [];
        
        // Restore heroes
        this.game.heroes = [];
        if (savedGame.heroes && Array.isArray(savedGame.heroes)) {
            savedGame.heroes.forEach(heroData => {
                const hero = new Hero();
                Object.assign(hero, heroData);
                this.game.heroes.push(hero);
            });
        }
        
        // Restore dungeons
        this.game.dungeons = [];
        if (savedGame.dungeons && Array.isArray(savedGame.dungeons)) {
            savedGame.dungeons.forEach(dungeonData => {
                const dungeon = Dungeon.fromJSON(dungeonData);
                this.game.dungeons.push(dungeon);
            });
        }
        
        // Restore potions inventory
        this.game.potions = savedGame.potions || {};
    }

    /**
     * Reset the game by clearing all saved data
     */
    resetGame() {
        // Clear local storage
        localStorage.removeItem('heroville_save');
        
        // Initialize a new game
        this.game.initNewGame();
        
        // Log that the game was reset
        this.game.log("Game has been reset.");
    }

    /**
     * Convert heroes to a serializable format
     * @returns {Array} Array of serialized hero objects
     */
    serializeHeroes() {
        return this.game.heroes.map(hero => {
            const serializedHero = { ...hero };
            // Remove circular references or functions
            delete serializedHero.game;
            return serializedHero;
        });
    }

    /**
     * Convert dungeons to a serializable format
     * @returns {Array} Array of serialized dungeon objects
     */
    serializeDungeons() {
        return this.game.dungeons.map(dungeon => dungeon.toJSON());
    }
}

export { SaveLoadSystem };