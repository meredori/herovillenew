<!-- HeroCard.svelte - Reusable hero card component -->
<script>
  import ProgressBar from './ProgressBar.svelte';
  
  export let hero = {};
  export let themeColor = '#4a83ff'; // Default blue theme
  export let showProgress = false;
  export let showEquipment = false;
  export let showInventory = false;
  export let compact = false; // New option for compact display
</script>

<div class="hero-card {compact ? 'hero-card-compact' : ''}" style="--theme-color: {themeColor}">
  <div class="hero-header">
    <h4>{hero.name}</h4>
    <div class="hero-level">Level {hero.level}</div>
  </div>
  
  {#if !compact}
    <div class="hero-content">
      <div class="hero-primary-info">
        <div class="hero-health">
          <div class="health-label">
            Health: {hero.health}
          </div>
          {#if typeof hero.health === 'string'}
            {@const [current, max] = hero.health.split('/').map(Number)}
            {@const healthPercent = (current / max) * 100}
            <ProgressBar value={healthPercent} color="#4caf50" />
          {:else}
            <ProgressBar value={50} color="#4caf50" />
          {/if}
        </div>
        
        {#if showProgress && hero.status === 'exploring'}
          <div class="hero-progress">
            <p><strong>Exploring:</strong> {hero.dungeonId}</p>
            {#if hero.dungeonProgress !== undefined}
              <p>Progress: {hero.dungeonProgress}</p>
              <ProgressBar value={(hero.dungeonProgress / 10) * 100} color="#4a83ff" />
            {/if}
            
            {#if hero.dungeonSuccessChance !== null}
              {@const chanceClass = 
                hero.dungeonSuccessChance > 75 ? 'high-chance' : 
                hero.dungeonSuccessChance > 50 ? 'medium-chance' : 
                hero.dungeonSuccessChance > 25 ? 'low-chance' : 'very-low-chance'}
              <div class="success-chance">
                <p>Success Chance: <span class="chance {chanceClass}">{hero.dungeonSuccessChance}%</span></p>
                <ProgressBar 
                  value={hero.dungeonSuccessChance} 
                  showStatusColors={true} 
                  highThreshold={75} 
                  mediumThreshold={25} 
                />
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
      <div class="hero-secondary-info">
        {#if showEquipment && showInventory}
          <div class="hero-columns">
            <div class="hero-equipment">
              <h5><span class="equipment-icon">⚔️</span> Equipment</h5>
              <ul class="equipment-list">
                <li>Weapon: {hero.equipment?.weapon?.name || 'None'}</li>
                <li>Armor: {hero.equipment?.armor || 'None'}</li>
                <li>Accessory: {hero.equipment?.accessory || 'None'}</li>
              </ul>
            </div>
            
            <div class="hero-inventory">
              <h5><span class="inventory-icon">🎒</span> Inventory</h5>
              <ul class="inventory-list">
                <li><span title="Gold" aria-label="Gold">🪙</span> Gold: {hero.inventory?.gold || 0}</li>
                <li><span title="Monster Parts" aria-label="Monster Parts">🦴</span> Monster Parts: {hero.inventory?.monsterParts || 0}</li>
                
                {#if hero.inventory?.potions && typeof hero.inventory.potions === 'object'}
                  {#each Object.entries(hero.inventory.potions) as [potionId, qty]}
                    {#if qty > 0}
                      <li>
                        <span>🧪</span> {potionId}: {qty}
                      </li>
                    {/if}
                  {/each}
                {/if}
              </ul>
            </div>
          </div>
        {:else if showEquipment}
          <div class="hero-equipment">
            <h5><span class="equipment-icon">⚔️</span> Equipment</h5>
            <ul class="equipment-list">
              <li>Weapon: {hero.equipment?.weapon?.name || 'None'}</li>
              <li>Armor: {hero.equipment?.armor || 'None'}</li>
              <li>Accessory: {hero.equipment?.accessory || 'None'}</li>
            </ul>
          </div>
        {:else if showInventory}
          <div class="hero-inventory">
            <h5><span class="inventory-icon">🎒</span> Inventory</h5>
            <ul class="inventory-list">
              <li><span title="Gold" aria-label="Gold">🪙</span> Gold: {hero.inventory?.gold || 0}</li>
              <li><span title="Monster Parts" aria-label="Monster Parts">🦴</span> Monster Parts: {hero.inventory?.monsterParts || 0}</li>
              
              {#if hero.inventory?.potions && typeof hero.inventory.potions === 'object'}
                {#each Object.entries(hero.inventory.potions) as [potionId, qty]}
                  {#if qty > 0}
                    <li>
                      <span>🧪</span> {potionId}: {qty}
                    </li>
                  {/if}
                {/each}
              {/if}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Compact view only shows health bar -->
    <div class="hero-health">
      <div class="health-label">
        Health: {hero.health}
      </div>
      {#if typeof hero.health === 'string'}
        {@const [current, max] = hero.health.split('/').map(Number)}
        {@const healthPercent = (current / max) * 100}
        <ProgressBar value={healthPercent} color="#4caf50" />
      {:else}
        <ProgressBar value={50} color="#4caf50" />
      {/if}
    </div>
  {/if}
  
  <!-- Additional content slot -->
  <slot></slot>
</div>

<style>
  .hero-card {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border-left: 4px solid var(--theme-color);
  }
  
  .hero-card-compact {
    padding: 0.75rem;
  }
  
  .hero-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .hero-header h4 {
    margin: 0;
    color: var(--theme-color);
    font-size: 1.2rem;
  }
  
  .hero-level {
    background-color: rgba(var(--theme-color-rgb, 74, 131, 255), 0.1);
    color: var(--theme-color);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .hero-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .hero-health {
    margin-bottom: 1rem;
  }
  
  .health-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  .hero-progress {
    background-color: #f8f8f8;
    border-radius: 0.25rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .hero-progress p {
    margin: 0 0 0.5rem 0;
  }
  
  .success-chance {
    margin-top: 0.75rem;
  }
  
  .chance {
    font-weight: bold;
  }
  
  .high-chance { color: #4caf50; }
  .medium-chance { color: #ffab00; }
  .low-chance { color: #ff7043; }
  .very-low-chance { color: #f44336; }
  
  .hero-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .hero-equipment, .hero-inventory {
    background-color: #f8f8f8;
    border-radius: 0.25rem;
    padding: 0.75rem;
  }
  
  .hero-equipment h5, .hero-inventory h5 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    display: flex;
    align-items: center;
  }
  
  .equipment-icon, .inventory-icon {
    margin-right: 0.5rem;
  }
  
  .equipment-list, .inventory-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.9rem;
  }
  
  .equipment-list li, .inventory-list li {
    margin-bottom: 0.25rem;
  }
  
  @media (min-width: 768px) {
    .hero-content {
      flex-direction: row;
    }
    
    .hero-primary-info {
      flex: 1;
    }
    
    .hero-secondary-info {
      flex: 1;
    }
  }
</style>