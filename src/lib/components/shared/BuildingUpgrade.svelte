<!-- BuildingUpgrade.svelte - Reusable building upgrade component -->
<script>
  export let building = {};
  export let upgradeCost = 0;
  export let canUpgrade = false;
  export let icon = '🏠';
  export let themeColor = '#7c5e2a'; // Default wood/brown theme
  export let onUpgradeClick = () => {};
</script>

<div class="building shared-card" style="--theme-color: {themeColor};">
  <div class="building-header">
    <h3><span class="building-icon">{icon}</span> {building.name}</h3>
    <div class="building-level">Level {building.level}</div>
  </div>
  
  <p class="building-description">{building.description}</p>
  
  <div class="spacer"></div>
  
  <div class="building-footer">
    <div class="building-cost">
      <p><span class="cost-icon">🧱</span> Upgrade cost: <span class="cost-value">{upgradeCost} materials</span></p>
    </div>
    
    <button 
      class="upgrade-button" 
      disabled={!canUpgrade}
      on:click={onUpgradeClick}
    >
      <span class="button-icon">⬆️</span> Upgrade {building.name}
    </button>
  </div>
</div>

<style>
  /* Remove duplicate card container styles now handled by .shared-card */
  .building {
    /* Only keep styles unique to BuildingUpgrade, if any */
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 300px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .building-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .building-header h3 {
    margin: 0;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    color: var(--theme-color);
  }

  .building-icon {
    font-size: 1.6rem;
    margin-right: 0.5rem;
  }

  .building-level {
    font-size: 0.8rem;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background-color: var(--theme-color);
    color: white;
  }

  .building-description {
    color: #555;
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .spacer {
    flex-grow: 1;
  }

  .building-footer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: auto;
  }

  .building-cost {
    padding: 0.75rem;
    background-color: #f8f8f8;
    border-radius: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .cost-icon {
    margin-right: 0.5rem;
  }

  .cost-value {
    font-weight: bold;
    color: #3e2c1c;
  }

  .upgrade-button {
    width: 100%;
    padding: 0.5rem;
    background-color: var(--theme-color);
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: filter 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  .upgrade-button:hover:not([disabled]) {
    filter: brightness(110%);
  }

  .upgrade-button[disabled] {
    background-color: #ccc;
    color: #a89b7c;
    cursor: not-allowed;
  }

  .button-icon {
    font-size: 1.1rem;
  }
</style>