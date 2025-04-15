<!-- Apothecary.svelte - Apothecary building component -->
<script>
  import gameStore from '../../core/gameStore.js';
  import { resources } from '../../core/gameStore.js';
  import { get } from 'svelte/store';
  import { onDestroy } from 'svelte';
  import { Consumables, getConsumableById } from '../../entities/consumable.js';

  // Use Consumables for the potions list
  const potions = Consumables.filter(c => c.type === 'potion');

  let potionsInventory = {};
  let unsubscribe;
  // Subscribe to gameStore to get potion inventory reactively
  unsubscribe = gameStore.subscribe(game => {
    potionsInventory = game?.potions || {};
  });
  onDestroy(() => { if (unsubscribe) unsubscribe(); });

  // Check if player can afford a potion
  function canAffordPotion(potion) {
    if (!potion.cost) return true;
    
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

  // Add a function for a hero to buy a potion from the town
  function buyPotion(potionId, hero) {
    const potion = getConsumableById(potionId);
    if (!potion) return;
    gameStore.update(game => {
      if (!game.potions || (game.potions[potion.id] || 0) < 1) {
        if (typeof game.log === 'function') {
          game.log(`No ${potion.name} available in town inventory.`);
        }
        return game;
      }
      if (!hero || hero.inventory.gold < potion.salePrice) {
        if (typeof game.log === 'function') {
          game.log(`${hero?.name || 'Hero'} does not have enough gold to buy a ${potion.name}.`);
        }
        return game;
      }
      // Transaction: hero pays gold, town receives gold, hero gets potion, town loses potion
      hero.inventory.gold -= potion.salePrice;
      game.resources.gold += potion.salePrice;
      game.potions[potion.id] -= 1;
      if (!hero.inventory.potions) hero.inventory.potions = {};
      hero.inventory.potions[potion.id] = (hero.inventory.potions[potion.id] || 0) + 1;
      if (typeof game.log === 'function') {
        game.log(`${hero.name} bought a ${potion.name} for ${potion.salePrice} gold.`);
      }
      return game;
    });
  }
</script>

<div class="apothecary-container">
  <h2>Apothecary</h2>
  
  <p class="apothecary-description">
    Welcome to the Apothecary! Here you can brew potions using monster parts to help your heroes.
  </p>
  
  <div class="potions-list">
    {#each potions as potion}
      {@const affordable = canAffordPotion(potion)}
      
      <div class="potion-card {potion.disabled ? 'disabled' : ''}">
        <div class="potion-header">
          <div class="potion-icon">{potion.icon}</div>
          <h3>{potion.name}</h3>
        </div>
        <div class="potion-owned">
          <span class="owned-label">Owned:</span>
          <span class="owned-amount">{potionsInventory[potion.id] || 0}</span>
        </div>
        <div class="potion-sale-price">
          <span class="sale-label">Sale Price:</span>
          <span class="sale-amount">{potion.salePrice} 🪙</span>
        </div>
        
        <p class="potion-description">{potion.description}</p>
        
        <div class="potion-cost">
          {#if potion.cost}
            <p>Cost:</p>
            <ul class="cost-list">
              {#each Object.entries(potion.cost) as [resource, amount]}
                {@const resourceIcons = {
                  monsterParts: '🦴',
                  gold: '🪙',
                  materials: '🧱'
                }}
                <li>
                  <span class="resource-icon">{resourceIcons[resource]}</span>
                  <span class="resource-name">{resource}: </span>
                  <span class="resource-amount">{amount}</span>
                </li>
              {/each}
            </ul>
          {:else}
            <p>No resources required.</p>
          {/if}
        </div>
        
        <button 
          class="brew-button"
          disabled={!affordable || potion.disabled}
          on:click={() => brewPotion(potion)}
        >
          {potion.disabled ? 'Not Available' : 'Brew Potion'}
        </button>
      </div>
    {/each}
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
  
  .apothecary-description {
    margin-bottom: 1.5rem;
    color: #555;
  }
  
  .potions-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
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
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .potion-icon {
    font-size: 1.5rem;
    margin-right: 0.75rem;
    background-color: #f7f2fc;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .potion-header h3 {
    margin: 0;
    color: #8e44ad;
  }
  
  .potion-owned {
    margin-bottom: 1rem;
    color: #555;
  }
  
  .owned-label {
    font-weight: bold;
    margin-right: 0.5rem;
  }
  
  .owned-amount {
    font-weight: bold;
  }
  
  .potion-sale-price {
    margin-bottom: 1rem;
    color: #555;
  }
  
  .sale-label {
    font-weight: bold;
    margin-right: 0.5rem;
  }
  
  .sale-amount {
    font-weight: bold;
  }
  
  .potion-description {
    color: #555;
    margin-bottom: 1.5rem;
  }
  
  .potion-cost {
    margin-bottom: 1.5rem;
  }
  
  .potion-cost p {
    margin: 0 0 0.5rem 0;
    font-weight: bold;
    color: #666;
  }
  
  .cost-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .cost-list li {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .resource-icon {
    margin-right: 0.5rem;
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
    padding: 0.75rem;
    background-color: #8e44ad;
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .brew-button:hover:not([disabled]) {
    background-color: #7d3c98;
  }
  
  .brew-button[disabled] {
    background-color: #ccc;
    cursor: not-allowed;
  }
</style>