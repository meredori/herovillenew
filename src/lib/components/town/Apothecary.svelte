<!-- Apothecary.svelte - Apothecary building component -->
<script>
  import gameStore, { resources, buildings, heroes } from '../../core/gameStore.js';
  import { get } from 'svelte/store';
  import { onDestroy } from 'svelte';
  import { Consumables, getConsumableById, getMaxStack, DEFAULT_MAX_POTIONS } from '../../entities/consumable.js';

  // Use Consumables for the potions list
  const potions = Consumables.filter(c => c.type === 'potion');

  // Get current town potion inventory reactively
  $: potionsInventory = $gameStore.potions || {};

  // Ensure Svelte reactivity for resources
  $: $resources;

  // Check if player can afford a potion
  function canAffordPotion(potion) {
    if (!potion.cost) return true;
    // Check all required resources, including monster parts
    return Object.entries(potion.cost).every(([resource, amount]) => {
      return $resources[resource] >= amount;
    });
  }

  // Brew a potion
  function brewPotion(potion) {
    gameStore.update(game => {
      // Deduct resources
      if (potion.cost) {
        Object.entries(potion.cost).forEach(([resource, amount]) => {
          if (game.resources && typeof game.resources[resource] === 'number') {
            game.resources[resource] = Math.max(0, game.resources[resource] - amount);
          }
        });
      }
      // Add potion to inventory
      if (!game.potions) game.potions = {};
      game.potions[potion.id] = (game.potions[potion.id] || 0) + 1;
      if (typeof game.log === 'function') {
        game.log(`Brewed a ${potion.name}! Added to town inventory.`);
      }
      return game;
    });
  }
  
  // Get the color for stock display
  function getStockColor(count) {
    if (count >= 5) return 'high-stock';
    if (count >= 2) return 'medium-stock';
    return 'low-stock';
  }
</script>

<div class="apothecary-container">
  <h2>Apothecary</h2>
  
  <p class="apothecary-description">
    Welcome to the Apothecary! Here you can brew potions using monster parts to help your heroes.
    Heroes will automatically buy potions from town inventory when they go shopping.
  </p>
  
  <h3>Brew Potions</h3>
  <div class="potions-grid">
    {#each potions as potion}
      <div class="potion-card {potion.disabled ? 'disabled' : ''}">
        <div class="potion-header">
          <h4>{potion.name}</h4>
          <div class="potion-stock {getStockColor(potionsInventory[potion.id] || 0)}">
            Stock: {potionsInventory[potion.id] || 0}
          </div>
        </div>
        
        <p class="potion-description">{potion.description}</p>
        
        <div class="potion-stats">
          <div class="stat-item">
            <span class="stat-icon">{potion.icon || '🧪'}</span>
            <span class="stat-label">Effect:</span>
            <span class="stat-value">{potion.effect || 'Healing'}</span>
          </div>
        </div>
        
        <div class="potion-cost">
          <p>Cost to Brew:</p>
          <ul class="cost-list">
            {#if potion.cost && potion.cost.monsterParts}
              <li>
                <span class="resource-icon">🦴</span>
                <span class="resource-name">Monster Parts: </span>
                <span class="resource-amount">{potion.cost.monsterParts}</span>
              </li>
            {/if}
          </ul>
          <p>Hero Purchase Price:</p>
          <ul class="cost-list">
            <li>
              <span class="resource-icon">🪙</span>
              <span class="resource-name">Gold: </span>
              <span class="resource-amount">{potion.salePrice}</span>
            </li>
          </ul>
        </div>
        
        <button 
          class="brew-button"
          disabled={!canAffordPotion(potion)}
          on:click={() => brewPotion(potion)}
        >
          {potion.disabled ? 'Not Available' : 'Brew Potion'}
        </button>
      </div>
    {/each}
  </div>
  
  <h3>Heroes' Potions</h3>
  <div class="heroes-potions">
    {#if $heroes.length === 0}
      <div class="info-message">
        <p>No heroes have joined your village yet.</p>
      </div>
    {:else}
      {#each $heroes as hero}
        <div class="hero-potions-card">
          <div class="hero-header">
            <h4>{hero.name}</h4>
            <div class="hero-level">Level {hero.level}</div>
          </div>
          
          <div class="potions-section">
            <div class="current-potions">
              <h5>Potions:</h5>
              {#if hero.inventory && hero.inventory.potions && Object.keys(hero.inventory.potions).length > 0}
                <div class="potions-info">
                  {#each Object.entries(hero.inventory.potions) as [potionId, quantity]}
                    {@const potion = getConsumableById(potionId)}
                    {#if potion && quantity > 0}
                      <div class="potion-item">
                        <span class="potion-icon">{potion.icon || '🧪'}</span>
                        <span class="potion-name">{potion.name}</span>
                        <span class="potion-quantity">x{quantity}</span>
                      </div>
                    {/if}
                  {/each}
                </div>
              {:else}
                <p class="no-potions">No potions carried</p>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .apothecary-container {
    padding: 0.5rem;
  }
  
  h2 {
    margin-top: 0;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
  }
  
  h3 {
    margin-top: 1.5rem;
    color: #8e44ad;
    border-bottom: 1px solid #e9d8f7;
    padding-bottom: 0.5rem;
  }
  
  h4 {
    margin: 0;
    color: #8e44ad;
    font-size: 1.2rem;
  }
  
  .apothecary-description {
    margin-bottom: 1.5rem;
    color: #555;
  }
  
  .resources-panel {
    background-color: #f8f8f8;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .resources-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .resource-item {
    display: flex;
    align-items: center;
    background-color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }
  
  .resource-icon {
    margin-right: 0.5rem;
  }
  
  .resource-label {
    margin-right: 0.5rem;
    color: #666;
  }
  
  .resource-value {
    font-weight: bold;
  }
  
  .potions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }
  
  .potion-card {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
    border-left: 4px solid #8e44ad;
  }
  
  .potion-card:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .potion-card.disabled {
    opacity: 0.7;
    border-left-color: #ccc;
  }
  
  .potion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .potion-stock {
    font-size: 0.8rem;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
  
  .high-stock {
    background-color: #4caf50;
    color: white;
  }
  
  .medium-stock {
    background-color: #ff9800;
    color: white;
  }
  
  .low-stock {
    background-color: #f44336;
    color: white;
  }
  
  .potion-description {
    margin-bottom: 1rem;
    color: #555;
  }
  
  .potion-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background-color: #f8f8f8;
    border-radius: 0.25rem;
    font-size: 0.9rem;
  }
  
  .stat-icon {
    margin-right: 0.5rem;
  }
  
  .stat-label {
    color: #666;
    margin-right: 0.5rem;
  }
  
  .stat-value {
    font-weight: bold;
  }
  
  .potion-cost p {
    margin: 0 0 0.5rem 0;
    font-weight: bold;
    color: #666;
  }
  
  .cost-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem 0;
  }
  
  .cost-list li {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .resource-name {
    text-transform: capitalize;
  }
  
  .resource-amount {
    font-weight: bold;
    margin-left: 0.25rem;
  }
  
  .brew-button {
    width: 100%;
    padding: 0.5rem;
    background-color: #8e44ad;
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    cursor: pointer;
  }
  
  .brew-button:hover:not([disabled]) {
    background-color: #9b59b6;
  }
  
  .brew-button[disabled] {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .heroes-potions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }
  
  .hero-potions-card {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .hero-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e9d8f7;
  }
  
  .hero-level {
    background-color: #e9d8f7;
    color: #8e44ad;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .potions-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .current-potions {
    padding: 0.75rem;
    background-color: #f8f8f8;
    border-radius: 0.25rem;
  }
  
  .current-potions h5 {
    margin: 0 0 0.75rem 0;
    color: #555;
    font-size: 0.9rem;
  }
  
  .potions-info {
    padding: 0.75rem;
    background-color: white;
    border-radius: 0.25rem;
  }
  
  .potion-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .potion-icon {
    margin-right: 0.5rem;
  }
  
  .potion-name {
    flex: 1;
  }
  
  .potion-quantity {
    font-weight: bold;
  }
  
  .no-potions {
    color: #999;
    font-style: italic;
    padding: 0.75rem;
    text-align: center;
  }
  
  .info-message {
    padding: 1.2rem;
    background: #f3e9f2 url('https://www.transparenttextures.com/patterns/old-mathematics.png');
    border-radius: 1rem;
    border: 2px dashed #9b59b6;
    text-align: center;
    color: #8e44ad;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
  }
  
  @media (max-width: 768px) {
    .potions-section {
      grid-template-columns: 1fr;
    }
  }
</style>