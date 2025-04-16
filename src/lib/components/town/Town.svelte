<!-- Town.svelte - Component for the Town tab in Heroville -->
<script>
  import gameStore from '../../core/gameStore.js';
  import { resources, buildings } from '../../core/gameStore.js';
  
  // Building icons
  const buildingIcons = {
    tent: '⛺',
    apothecary: '🧪',
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
  <section class="buildings-section">
    <h2>Buildings</h2>
    
    {#if $buildings.length > 0}
      <div class="buildings-list">
        {#each $buildings as building}
          {@const icon = buildingIcons[building.id] || buildingIcons.default}
          {@const upgradeCost = calculateUpgradeCost(building)}
          {@const canUpgrade = canAffordUpgrade(building)}
          
          <div class="building">
            <div class="building-header">
              <h3><span class="building-icon">{icon}</span> {building.name}</h3>
              <div class="building-level">Level {building.level}</div>
            </div>
            <p class="building-description">{building.description}</p>
            <div class="building-cost">
              <p><span class="cost-icon">🧱</span> Upgrade cost: <span class="cost-value">{upgradeCost} materials</span></p>
            </div>
            <button 
              class="upgrade-button" 
              disabled={!canUpgrade}
              on:click={() => upgradeBuilding(building.id)}
            >
              <span class="button-icon">⬆️</span> Upgrade {building.name}
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <div class="info-message">
        <p>No buildings available yet.</p>
      </div>
    {/if}
  </section>
</div>

<style>
  /* Fantasy/Medieval Theme */
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=MedievalSharp&display=swap');

  :global(body) {
    background: #f3e9d2 url('https://www.transparenttextures.com/patterns/old-mathematics.png');
    color: #3e2c1c;
  }

  .town-container {
    /* Update town container layout since resources are now gone */
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    background: #f8f5e4 url('https://www.transparenttextures.com/patterns/paper-fibers.png');
    border: 6px double #bfa76a;
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px rgba(80,60,20,0.18);
    padding: 2rem;
    margin-top: 1rem;
  }

  h2 {
    margin-top: 0;
    font-size: 2rem;
    color: #7c5e2a;
    background: linear-gradient(90deg, #e9d8a6 60%, #bfa76a 100%);
    border-bottom: 4px solid #bfa76a;
    border-radius: 0.5rem 0.5rem 0 0;
    padding: 0.5rem 1rem;
    box-shadow: 0 2px 8px rgba(80,60,20,0.08);
    letter-spacing: 2px;
  }

  .buildings-section {
    background: #f6edd9 url('https://www.transparenttextures.com/patterns/wood-pattern.png');
    border: 4px solid #bfa76a;
    border-radius: 1rem;
    box-shadow: 0 2px 8px rgba(80,60,20,0.10);
    padding: 1.5rem 1rem 1rem 1rem;
    margin-bottom: 1rem;
    width: 100%;
  }

  .buildings-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.2rem;
  }

  .building {
    background: #f3e9d2 url('https://www.transparenttextures.com/patterns/wood-pattern.png');
    border: 3px solid #bfa76a;
    border-radius: 1rem;
    padding: 1.2rem;
    box-shadow: 0 2px 8px rgba(80,60,20,0.10);
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
  }

  .building:before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1rem;
    pointer-events: none;
    box-shadow: 0 0 24px 4px #e9d8a6 inset;
    opacity: 0.5;
  }

  .building:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 6px 16px rgba(80,60,20,0.13);
  }

  .building-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .building-icon {
    font-size: 2rem;
    margin-right: 0.5rem;
    filter: drop-shadow(0 1px 0 #bfa76a);
  }

  .building-level {
    font-size: 1rem;
    background: #e9d8a6;
    color: #7c5e2a;
    padding: 0.3rem 0.7rem;
    border-radius: 1rem;
    border: 2px solid #bfa76a;
  }

  .building-description {
    color: #3e2c1c;
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .building-cost {
    font-size: 1rem;
    margin-bottom: 1rem;
    color: #7c5e2a;
  }

  .cost-value {
    font-weight: bold;
    color: #3e2c1c;
  }

  .upgrade-button {
    width: 100%;
    padding: 0.85rem;
    background: linear-gradient(90deg, #7c5e2a 60%, #bfa76a 100%);
    color: #fffbe6;
    border: 3px solid #7c5e2a;
    border-radius: 1rem;
    font-size: 1.05rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(80,60,20,0.10);
    letter-spacing: 1px;
    transition: background 0.2s, color 0.2s;
  }

  .upgrade-button:hover:not([disabled]) {
    background: linear-gradient(90deg, #bfa76a 60%, #7c5e2a 100%);
    color: #3e2c1c;
  }

  .upgrade-button[disabled] {
    background: #d6c7a1;
    color: #a89b7c;
    cursor: not-allowed;
    border: 3px solid #bfa76a;
  }

  .info-message {
    padding: 1.2rem;
    background: #f3e9d2 url('https://www.transparenttextures.com/patterns/old-mathematics.png');
    border-radius: 1rem;
    border: 2px dashed #bfa76a;
    text-align: center;
    color: #7c5e2a;
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    .town-container {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
  }
</style>