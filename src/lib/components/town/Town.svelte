<!-- Town.svelte - Component for the Town tab in Heroville -->
<script>
  import gameStore from '../../core/gameStore.js';
  import { resources, buildings } from '../../core/gameStore.js';
  import BuildingUpgrade from '../shared/BuildingUpgrade.svelte';
  
  // Building icons
  const buildingIcons = {
    tent: '⛺',
    apothecary: '🧪',
    blacksmith: '⚒️',
    default: '🏠'
  };
  
  // Handle building upgrade
  function upgradeBuilding(buildingId) {
    gameStore.update(game => {
      if (game && typeof game.upgradeBuilding === 'function') {
        game.upgradeBuilding(buildingId);
      }
      return game;
    });
  }
  
  // Calculate building upgrade cost
  function calculateUpgradeCost(building) {
    let cost = 0;
    gameStore.subscribe(game => {
      if (game && typeof game.calculateBuildingUpgradeCost === 'function') {
        cost = game.calculateBuildingUpgradeCost(building);
      }
    })(); // Immediately unsubscribe
    return cost;
  }
  
  // Check if player can afford upgrade
  function canAffordUpgrade(building) {
    const cost = calculateUpgradeCost(building);
    return ($resources?.materials ?? 0) >= cost;
  }
</script>

<div class="town-container">
  <h2>Buildings</h2>
  
  <div class="buildings-section">
    {#if $buildings.length > 0}
      <div class="buildings-list">
        {#each $buildings as building}
          {@const icon = buildingIcons[building.id] || buildingIcons.default}
          {@const upgradeCost = calculateUpgradeCost(building)}
          {@const canUpgrade = canAffordUpgrade(building)}
          
          <BuildingUpgrade
            building={building}
            upgradeCost={upgradeCost}
            canUpgrade={canUpgrade}
            icon={icon}
            themeColor="#2e7d32"
            onUpgradeClick={() => upgradeBuilding(building.id)}
          />
        {/each}
      </div>
    {:else}
      <div class="info-message">
        <p>No buildings available yet.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .town-container {
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
    color: #2e7d32; /* Green color for Town tab */
    border-bottom: 1px solid #a5d6a7;
    padding-bottom: 0.5rem;
  }

  .buildings-section {
    margin-top: 1rem;
  }

  .buildings-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .info-message {
    padding: 2rem;
    background: #e8f5e9 url('https://www.transparenttextures.com/patterns/old-mathematics.png');
    border-radius: 1rem;
    border: 2px dashed #4caf50;
    text-align: center;
    color: #2e7d32;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
  }

  @media (max-width: 1200px) {
    .buildings-list {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .buildings-list {
      grid-template-columns: 1fr;
    }
  }
</style>