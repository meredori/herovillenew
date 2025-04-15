<!-- App.svelte - Main component for Heroville game -->
<script>
  import { onMount } from 'svelte';
  import gameStore, { initGame } from './lib/core/gameStore.js';
  
  // Import tab components
  import Tabs from './lib/components/Tabs.svelte';
  import Town from './lib/components/town/Town.svelte';
  import Heroes from './lib/components/heroes/Heroes.svelte';
  import Dungeons from './lib/components/dungeons/Dungeons.svelte';
  import Apothecary from './lib/components/town/Apothecary.svelte';
  import GameLog from './lib/components/GameLog.svelte';
  
  // Game state
  let activeTab = 'town';
  let gameInitialized = false;
  let game;
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
    { id: 'apothecary', label: 'Apothecary', condition: game?.buildings?.some(b => b.id === 'apothecary' && b.level > 0) }
  ] : [{ id: 'town', label: 'Town' }];
  
  // Filter tabs based on conditions
  $: visibleTabs = tabs.filter(tab => tab.condition !== false);
  
  // Handle tab changes
  function handleTabChange(newTab) {
    activeTab = newTab;
  }
  
  // Save, load, and reset game
  function saveGame() {
    if (gameInitialized && game?.saveLoadSystem) {
      game.saveLoadSystem.saveGame();
      game.log("Game saved successfully");
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
    }
  }
</script>

<main>
  <header>
    <h1>Heroville</h1>
    <div class="game-controls">
      <button on:click={saveGame}>Save Game</button>
      <button on:click={loadGame}>Load Game</button>
      <button on:click={resetGame}>Reset Game</button>
    </div>
  </header>
  
  <div class="game-container">
    <section class="game-content">
      {#if gameInitialized && Tabs && Town && Heroes && Dungeons && Apothecary}
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
        </div>
      {:else}
        <div class="loading">
          <p>Loading Heroville...</p>
        </div>
      {/if}
    </section>
    
    <aside class="game-log">
      {#if GameLog}
        <GameLog />
      {/if}
    </aside>
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
    display: flex;
    gap: 0.5rem;
  }
  
  .game-container {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 1rem;
    height: calc(100vh - 120px);
  }
  
  .game-content {
    display: flex;
    flex-direction: column;
  }
  
  .tab-content {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 0.5rem;
  }
  
  .game-log {
    height: 100%;
    overflow-y: auto;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 0.5rem;
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
</style>
