<!-- Apothecary.svelte - Apothecary building component -->
<script>
  import gameStore, { resources, buildings, heroes } from '../../core/gameStore.js';
  import { get } from 'svelte/store';
  import { onDestroy } from 'svelte';
  import { Consumables, getConsumableById, getMaxStack, DEFAULT_MAX_POTIONS, getAvailablePotions } from '../../entities/consumable.js';
  
  // Import shared components
  import ItemCard from '../shared/ItemCard.svelte';
  import StatItem from '../shared/StatItem.svelte';
  import ResourceCost from '../shared/ResourceCost.svelte';
  import CostsList from '../shared/CostsList.svelte';
  import HeroCard from '../shared/HeroCard.svelte';

  // Get the apothecary building
  $: apothecary = $buildings.find(b => b.id === 'apothecary') || { level: 0 };

  // Get potions available at the current apothecary level
  $: potions = getAvailablePotions(apothecary.level);

  // Get current town potion inventory reactively
  $: potionsInventory = $gameStore.potions || {};

  // Check if player can afford a potion
  function canAffordPotion(potion) {
    if (!potion.cost) return true;
    // Check all required resources, including monster parts
    return Object.entries(potion.cost).every(([resource, amount]) => {
      return $resources[resource] >= amount;
    });
  }

  // Brew a potion (refactored to accept potionId)
  function brewPotion(potionId) {
    const potion = Consumables.find(c => c.id === potionId && c.type === 'potion');
    if (!potion) return;
    gameStore.update(game => {
      // Check if player can afford to brew the potion
      if (!canAffordPotion(potion)) {
        game.log(`Not enough resources to brew ${potion.name}.`);
        return game;
      }
      // Deduct resources from town inventory (replace object for reactivity)
      if (potion.cost && potion.cost.monsterParts) {
        game.resources = {
          ...game.resources,
          monsterParts: game.resources.monsterParts - potion.cost.monsterParts
        };
      }
      // Initialize potion inventory if it doesn't exist
      if (!game.potions) game.potions = {};
      // Add potion to town inventory
      game.potions[potion.id] = (game.potions[potion.id] || 0) + 1;
      // Log the brewing
      game.log(`Brewed a ${potion.name}! Added to town inventory.`);
      return game;
    });
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
      <ItemCard
        item={potion}
        stock={potionsInventory[potion.id] || 0}
        themeColor="#8e44ad"
        buttonText="Brew Potion"
        buttonDisabled={!canAffordPotion(potion)}
        onButtonClick={() => brewPotion(potion.id)}
      >
        <div slot="stats">
          <StatItem 
            icon={potion.icon || '🧪'}
            label="Effect:"
            value={potion.effect || 'Healing'}
          />
        </div>
        
        <div slot="costs">
          <CostsList title="Cost to Brew:">
            {#if potion.cost && potion.cost.monsterParts}
              <ResourceCost 
                resourceName="Monster Parts"
                amount={potion.cost.monsterParts}
                icon="🦴"
              />
            {/if}
          </CostsList>
          
          <CostsList title="Hero Purchase Price:">
            <ResourceCost 
              resourceName="Gold"
              amount={potion.salePrice}
              icon="🪙"
            />
          </CostsList>
        </div>
      </ItemCard>
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
    width: 100% - 0.25rem;
    max-width: 1200px;
    margin: 0 auto;
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
  
  .potions-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-top: 1rem;
  }
  
  .heroes-potions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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
  
  @media (max-width: 1200px) {
    .potions-grid,
    .heroes-potions {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (max-width: 768px) {
    .potions-grid,
    .heroes-potions,
    .potions-section {
      grid-template-columns: 1fr;
    }
  }
</style>