/**
 * logging.js - Logging system for Heroville
 * 
 * Handles creating and maintaining the game log.
 */

class Logging {
    constructor(game) {
        this.game = game;
    }

    /**
     * Log a message to the game log
     * @param {string} message - The message to log
     */
    log(message) {
        this.game.logs.unshift({
            id: Date.now() + '_' + Math.floor(Math.random() * 1000000), // Ensures uniqueness
            text: message,
            timestamp: new Date().toLocaleTimeString()
        });
        
        // Keep log to a reasonable size
        if (this.game.logs.length > 100) {
            this.game.logs.pop();
        }
    }
}

export { Logging };