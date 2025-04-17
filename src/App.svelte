<!-- App.svelte - Main component for Heroville game -->
<script>
  import { onMount } from 'svelte';
  import gameStore, { initGame } from './lib/core/gameStore.js';
  
  // Import tab components
  import Tabs from './lib/components/Tabs.svelte';
  import Resources from './lib/components/resources/Resources.svelte';
  import Town from './lib/components/town/Town.svelte';
  import Heroes from './lib/components/heroes/Heroes.svelte';
  import Dungeons from './lib/components/dungeons/Dungeons.svelte';
  import Apothecary from './lib/components/town/Apothecary.svelte';
  import Blacksmith from './lib/components/town/Blacksmith.svelte';
  import GameLog from './lib/components/GameLog.svelte';
  
  // Game state
  let activeTab = 'town';
  let gameInitialized = false;
  let game;
  let showGameMenu = false; // Track dropdown menu visibility
  let showGameLog = false; // Track game log visibility
  const unsubscribe = gameStore.subscribe(value => game = value);
  
  // Initialize the game when the component mounts
  onMount(() => {
    initGame();
    gameInitialized = true;
  });
  
  // Define available tabs
  $: tabs = gameInitialized ? [
    { id: 'town', label: 'Town' },
    { id: 'heroes', label: 'Heroes', condition: game?.buildings?.some(b => b.id === 'tent' && b.level > 0) },
    { id: 'dungeons', label: 'Dungeons', condition: game?.buildings?.some(b => b.id === 'tent' && b.level > 0) },
    { id: 'apothecary', label: 'Apothecary', condition: game?.buildings?.some(b => b.id === 'apothecary' && b.level > 0) },
    { id: 'blacksmith', label: 'Blacksmith', condition: game?.buildings?.some(b => b.id === 'blacksmith' && b.level > 0) }
  ] : [{ id: 'town', label: 'Town' }];
  
  // Filter tabs based on conditions
  $: visibleTabs = tabs.filter(tab => tab.condition !== false);
  
  // Handle tab changes
  function handleTabChange(newTab) {
    activeTab = newTab;
  }
  
  // Toggle game menu dropdown
  function toggleGameMenu() {
    showGameMenu = !showGameMenu;
  }
  
  // Toggle game log visibility
  function toggleGameLog() {
    showGameLog = !showGameLog;
    showGameMenu = false; // Close dropdown after action
  }
  
  // Close menu when clicking outside
  function handleClickOutside(event) {
    const menu = document.getElementById('game-menu');
    const button = document.getElementById('game-menu-button');
    
    if (showGameMenu && menu && !menu.contains(event.target) && 
        button && !button.contains(event.target)) {
      showGameMenu = false;
    }
  }
  
  // Save, load, and reset game
  function saveGame() {
    if (gameInitialized && game?.saveLoadSystem) {
      game.saveLoadSystem.saveGame();
      game.log("Game saved successfully");
      showGameMenu = false; // Close dropdown after action
    }
  }
  
  function loadGame() {
    if (gameInitialized && game?.saveLoadSystem) {
      const savedGame = game.saveLoadSystem.loadGame();
      if (savedGame) {
        game.saveLoadSystem.loadGameState(savedGame);
        game.log("Game loaded successfully");
      } else {
        game.log("No saved game found");
      }
      showGameMenu = false; // Close dropdown after action
    }
  }
  
  function resetGame() {
    if (gameInitialized && game?.saveLoadSystem) {
      if (confirm("Are you sure you want to reset your game? All progress will be lost.")) {
        // Ensure Svelte store updates after reset
        gameStore.update(g => {
          g.saveLoadSystem.resetGame();
          return g;
        });
      }
      showGameMenu = false; // Close dropdown after action
    }
  }
</script>

<svelte:window on:click={handleClickOutside}/>

<main>
  <header>
    <h1>Heroville</h1>
    <div class="game-controls">
      <button id="game-menu-button" class="menu-button" on:click={toggleGameMenu}>
        Game Menu ▼
      </button>
      {#if showGameMenu}
        <div id="game-menu" class="dropdown-menu">
          <button on:click={saveGame}>Save Game</button>
          <button on:click={loadGame}>Load Game</button>
          <button on:click={resetGame}>Reset Game</button>
          <button on:click={toggleGameLog}>{showGameLog ? 'Hide' : 'Show'} Game Log</button>
        </div>
      {/if}
    </div>
  </header>
  
  <div class="game-container">
    <section class="game-content">
      {#if gameInitialized && Resources && Tabs && Town && Heroes && Dungeons && Apothecary && Blacksmith}
        <!-- Resources displayed above tabs, visible on all tab views -->
        <div class="resources-container">
          <Resources />
        </div>
        
        <Tabs {visibleTabs} {activeTab} on:tabChange={e => handleTabChange(e.detail)} />
        
        <div class="tab-content">
          <!-- Town Tab -->
          {#if activeTab === 'town' && Town}
            <Town />
          {/if}
          
          <!-- Heroes Tab -->
          {#if activeTab === 'heroes' && Heroes}
            <Heroes />
          {/if}
          
          <!-- Dungeons Tab -->
          {#if activeTab === 'dungeons' && Dungeons}
            <Dungeons />
          {/if}
          
          <!-- Apothecary Tab -->
          {#if activeTab === 'apothecary' && Apothecary}
            <Apothecary />
          {/if}
          
          <!-- Blacksmith Tab -->
          {#if activeTab === 'blacksmith' && Blacksmith}
            <Blacksmith />
          {/if}
        </div>
      {:else}
        <div class="loading">
          <p>Loading Heroville...</p>
        </div>
      {/if}
    </section>
    
    {#if showGameLog}
      <aside class="game-log">
        <div class="game-log-header">
          <h3 class="log-title">Game Log</h3>
          <button class="close-log-button" on:click={toggleGameLog}>×</button>
        </div>
        {#if GameLog}
          <GameLog />
        {/if}
      </aside>
    {/if}
    
    {#if !showGameLog}
      <button class="game-log-toggle" on:click={toggleGameLog} title="Show Game Log">
        📜
      </button>
    {/if}
  </div>
</main>

<style>
  main {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ccc;
  }
  
  h1 {
    font-size: 2rem;
    margin: 0;
  }
  
  .game-controls {
    position: relative;
  }
  
  .menu-button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 0.25rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-accent);
  }
  
  .menu-button:hover {
    background-color: #0069d9;
  }
  
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    min-width: 150px;
    overflow: hidden;
  }
  
  .dropdown-menu button {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
    color: #333; /* Add text color to ensure visibility */
    font-family: var(--font-accent);
  }
  
  .dropdown-menu button:last-child {
    border-bottom: none;
  }
  
  .dropdown-menu button:hover {
    background-color: #f5f5f5;
  }
  
  .game-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    height: calc(100vh - 120px);
  }
  
  .game-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .resources-container {
    margin-bottom: 1rem;
    width: 100%;
  }
  
  .tab-content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background-color: #f5f5f5;
    border-radius: 0.5rem;
    width: 100%;
    min-width: 1200px;
    max-width: 1200px;
    margin: 0 auto;
    box-sizing: border-box;
  }
  
  .game-log {
    width: 300px;
    max-height: 500px;
    overflow-y: auto;
    padding: 1rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    border: 1px solid #ddd;
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 100;
  }
  
  .game-log-toggle {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 101;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    .game-container {
      grid-template-columns: 1fr;
    }
    
    .game-log {
      height: 200px;
    }
  }
  
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    font-size: 1.5rem;
    color: #666;
  }

  .game-log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .log-title {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
  }
  
  .close-log-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
    color: #777;
    padding: 0;
    margin: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-log-button:hover {
    color: #333;
  }
</style>
