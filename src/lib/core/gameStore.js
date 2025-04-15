/**
 * gameStore.js - Svelte store for managing game state
 * 
 * Provides a centralized store for accessing game state throughout the application
 */

import { writable, derived } from 'svelte/store';
import { Game } from './game.js';
import { Dungeon } from '../entities/dungeon.js';
import { Hero } from '../entities/hero.js';

// Create a writable store with a new Game instance
const gameStore = writable(new Game());

// Derived stores for specific game state with default values
export const resources = derived(gameStore, $game => $game?.resources || { materials: 0, monsterParts: 0, gold: 0 });
export const buildings = derived(gameStore, $game => $game?.buildings || []);
export const heroes = derived(gameStore, $game => $game?.heroes || []);
export const dungeons = derived(gameStore, $game => $game?.dungeons || []);
export const logs = derived(gameStore, $game => $game?.logs || []);

// Method to initialize the game when the store is first used
export function initGame() {
    gameStore.update(game => {
        if (game) {
            game.init();
        }
        return game;
    });
}

// Method to update the UI after game state changes
export function updateUI() {
    gameStore.update(game => {
        return game;
    });
}

// Method to tick the game (for manual ticking if needed)
export function tick(deltaTime) {
    gameStore.update(game => {
        if (game) {
            game.update(deltaTime);
        }
        return game;
    });
}

// Helper for logging game messages
export function log(message) {
    gameStore.update(game => {
        if (game) {
            game.log(message);
        }
        return game;
    });
}

// --- Store mutation helpers for Svelte reactivity ---

/**
 * Adds a hero to the game and updates the store.
 * @param {Hero} hero - The hero to add.
 */
export function addHero(hero) {
    gameStore.update(game => {
        if (game && game.heroes) {
            game.heroes = [...game.heroes, hero];
        }
        return game;
    });
}

/**
 * Updates a hero in the game by id and updates the store.
 * @param {string} heroId - The id of the hero to update.
 * @param {object} changes - The changes to apply.
 */
export function updateHero(heroId, changes) {
    gameStore.update(game => {
        if (game && game.heroes) {
            game.heroes = game.heroes.map(h => {
                if (h.id === heroId) {
                    const updatedHero = h instanceof Hero ? h : new Hero(h.name);
                    Object.assign(updatedHero, h, changes);
                    return updatedHero;
                }
                return h;
            });
        }
        return game;
    });
}

/**
 * Removes a hero from the game by id and updates the store.
 * @param {string} heroId - The id of the hero to remove.
 */
export function removeHero(heroId) {
    gameStore.update(game => {
        if (game && game.heroes) {
            game.heroes = game.heroes.filter(h => h.id !== heroId);
        }
        return game;
    });
}

/**
 * Adds a dungeon to the game and updates the store.
 * @param {Dungeon} dungeon - The dungeon to add.
 */
export function addDungeon(dungeon) {
    gameStore.update(game => {
        if (game && game.dungeons) {
            game.dungeons = [...game.dungeons, dungeon];
        }
        return game;
    });
}

/**
 * Updates a dungeon in the game by id and updates the store.
 * @param {string} dungeonId - The id of the dungeon to update.
 * @param {Dungeon|object} updatedDungeon - The updated dungeon object or changes to apply.
 */
export function updateDungeon(dungeonId, updatedDungeon) {
    gameStore.update(game => {
        if (game && game.dungeons) {
            // Ensure updatedDungeon is a Dungeon instance
            const dungeonInstance = updatedDungeon instanceof Dungeon
                ? updatedDungeon
                : Dungeon.fromJSON(updatedDungeon);
            game.dungeons = game.dungeons.map(d => d.id === dungeonId ? dungeonInstance : d);
        }
        return game;
    });
}

/**
 * Removes a dungeon from the game by id and updates the store.
 * @param {string} dungeonId - The id of the dungeon to remove.
 */
export function removeDungeon(dungeonId) {
    gameStore.update(game => {
        if (game && game.dungeons) {
            game.dungeons = game.dungeons.filter(d => d.id !== dungeonId);
        }
        return game;
    });
}

/**
 * Similar helpers can be created for dungeons, buildings, etc.
 */

// --- Usage note ---
// Always use these helpers or gameStore.update() for mutations.
// Avoid direct mutation of objects/arrays in the store to ensure Svelte reactivity.

// Export the main store for direct access when needed
export default gameStore;