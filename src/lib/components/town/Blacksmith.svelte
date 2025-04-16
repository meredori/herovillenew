<!-- Blacksmith.svelte - Blacksmith building component -->
<script>
  import gameStore, { resources, buildings, heroes } from '../../core/gameStore.js';
  import { get } from 'svelte/store';
  import { onDestroy } from 'svelte';
  import { Weapons, getAvailableWeapons, calculateWeaponRepairCost } from '../../entities/weapon.js';

  // Get the blacksmith building
  $: blacksmith = $buildings.find(b => b.id === 'blacksmith') || { level: 0 };
  
  // Get weapons available at the current blacksmith level
  $: availableWeapons = getAvailableWeapons(blacksmith.level);
  
  // Get current town weapon inventory
  $: weaponStock = $gameStore.weapons || {};
  
  // Check if player can afford to craft a weapon
  function canAffordToCraft(weapon) {
    if (!weapon.cost) return true;
    
    return Object.entries(weapon.cost).every(([resource, amount]) => {
      return $resources[resource] >= amount;
    });
  }
  
  // Craft a weapon to add to town inventory
  function craftWeapon(weaponId) {
    gameStore.update(game => {
      // Find the weapon
      const weapon = Weapons.find(w => w.id === weaponId);
      if (!weapon) return game;
      
      // Check if player can afford to craft the weapon
      if (!canAffordToCraft(weapon)) {
        game.log(`Not enough resources to craft ${weapon.name}.`);
        return game;
      }
      
      // Deduct resources from town inventory
      game.resources.monsterParts -= weapon.cost.monsterParts;
      
      // Initialize weapon inventory if it doesn't exist
      if (!game.weapons) game.weapons = {};
      
      // Add weapon to town inventory
      game.weapons[weapon.id] = (game.weapons[weapon.id] || 0) + 1;
      
      // Log the crafting
      game.log(`Crafted a ${weapon.name} for the town's inventory.`);
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

<div class="blacksmith-container">
  <h2>Blacksmith</h2>
  
  <p class="blacksmith-description">
    Welcome to the Blacksmith! Here you can craft weapons for your heroes to purchase. 
    Heroes will automatically buy weapons from town inventory when they go shopping.
  </p>
  
  {#if blacksmith.level === 0}
    <div class="info-message">
      <p>The Blacksmith needs to be upgraded before it can be used.</p>
    </div>
  {:else}
    <h3>Craft Weapons</h3>
    <div class="weapons-grid">
      {#each availableWeapons as weapon}
        <div class="weapon-card">
          <div class="weapon-header">
            <h4>{weapon.name}</h4>
            <div class="weapon-stock {getStockColor(weaponStock[weapon.id] || 0)}">
              Stock: {weaponStock[weapon.id] || 0}
            </div>
          </div>
          
          <p class="weapon-description">{weapon.description}</p>
          
          <div class="weapon-stats">
            <div class="stat-item">
              <span class="stat-icon">⚔️</span>
              <span class="stat-label">Damage:</span>
              <span class="stat-value">{weapon.minDamage}-{weapon.maxDamage}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🛡️</span>
              <span class="stat-label">Durability:</span>
              <span class="stat-value">{weapon.maxDurability}</span>
            </div>
          </div>
          
          <div class="weapon-cost">
            <p>Cost to Craft:</p>
            <ul class="cost-list">
              <li>
                <span class="resource-icon">🦴</span>
                <span class="resource-name">Monster Parts: </span>
                <span class="resource-amount">{weapon.cost.monsterParts}</span>
              </li>
            </ul>
            <p>Hero Purchase Price:</p>
            <ul class="cost-list">
              <li>
                <span class="resource-icon">🪙</span>
                <span class="resource-name">Gold: </span>
                <span class="resource-amount">{weapon.salePrice}</span>
              </li>
            </ul>
          </div>
          
          <button 
            class="craft-button" 
            disabled={!canAffordToCraft(weapon)}
            on:click={() => craftWeapon(weapon.id)}
          >
            Craft Weapon
          </button>
        </div>
      {/each}
    </div>
    
    <h3>Heroes' Equipment</h3>
    <div class="heroes-equipment">
      {#if $heroes.length === 0}
        <div class="info-message">
          <p>No heroes have joined your village yet.</p>
        </div>
      {:else}
        {#each $heroes as hero}
          {@const heroInfo = hero.getDisplayInfo()}
          <div class="hero-equipment-card">
            <div class="hero-header">
              <h4>{hero.name}</h4>
              <div class="hero-level">Level {hero.level}</div>
            </div>
            
            <div class="equipment-section">
              <div class="current-weapon">
                <h5>Current Weapon:</h5>
                {#if hero.equipment.weapon}
                  <div class="weapon-info">
                    <p class="weapon-name">{hero.equipment.weapon.name}</p>
                    <p class="weapon-damage">Damage: {hero.equipment.weapon.minDamage}-{hero.equipment.weapon.maxDamage}</p>
                    <div class="durability-container">
                      <p class="durability-label">
                        Durability: {hero.equipment.weapon.durability}/{hero.equipment.weapon.maxDurability}
                      </p>
                      <div class="durability-bar">
                        <div 
                          class="durability-fill {
                            hero.equipment.weapon.durability > hero.equipment.weapon.maxDurability * 0.66 ? 'high-durability' :
                            hero.equipment.weapon.durability > hero.equipment.weapon.maxDurability * 0.33 ? 'medium-durability' :
                            'low-durability'
                          }" 
                          style="width: {(hero.equipment.weapon.durability / hero.equipment.weapon.maxDurability) * 100}%"
                        ></div>
                      </div>
                    </div>
                  </div>
                {:else}
                  <p class="no-weapon">No weapon equipped</p>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .blacksmith-container {
    padding: 0.5rem;
  }
  
  h2 {
    margin-top: 0;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
  }
  
  h3 {
    margin-top: 1.5rem;
    color: #7c5e2a;
    border-bottom: 1px solid #e9d8a6;
    padding-bottom: 0.5rem;
  }
  
  .blacksmith-description {
    margin-bottom: 1.5rem;
    color: #555;
  }
  
  .info-message {
    padding: 1.2rem;
    background: #f3e9d2 url('https://www.transparenttextures.com/patterns/old-mathematics.png');
    border-radius: 1rem;
    border: 2px dashed #bfa76a;
    text-align: center;
    color: #7c5e2a;
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
  }
  
  .weapons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }
  
  .weapon-card {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
    border-left: 4px solid #7c5e2a;
  }
  
  .weapon-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .weapon-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .weapon-header h4 {
    margin: 0;
    color: #7c5e2a;
    font-size: 1.2rem;
  }
  
  .weapon-stock {
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
  
  .weapon-description {
    margin-bottom: 1rem;
    color: #555;
  }
  
  .weapon-stats {
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
  
  .weapon-cost p {
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
  
  .craft-button {
    width: 100%;
    padding: 0.5rem;
    background-color: #7c5e2a;
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    cursor: pointer;
  }
  
  .craft-button:hover:not([disabled]) {
    background-color: #9c7e4a;
  }
  
  .craft-button[disabled] {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .heroes-equipment {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }
  
  .hero-equipment-card {
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
    border-bottom: 1px solid #e9d8a6;
  }
  
  .hero-header h4 {
    margin: 0;
    color: #7c5e2a;
  }
  
  .hero-level {
    background-color: #e9d8a6;
    color: #7c5e2a;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .equipment-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .current-weapon {
    padding: 0.75rem;
    background-color: #f8f8f8;
    border-radius: 0.25rem;
  }
  
  .current-weapon h5 {
    margin: 0 0 0.75rem 0;
    color: #555;
    font-size: 0.9rem;
  }
  
  .weapon-info {
    padding: 0.75rem;
    background-color: white;
    border-radius: 0.25rem;
  }
  
  .weapon-name {
    font-weight: bold;
    margin: 0 0 0.5rem 0;
  }
  
  .weapon-damage {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
  }
  
  .durability-container {
    margin-bottom: 0.75rem;
  }
  
  .durability-label {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
  }
  
  .durability-bar {
    height: 0.5rem;
    background-color: #eee;
    border-radius: 0.25rem;
    overflow: hidden;
  }
  
  .durability-fill {
    height: 100%;
  }
  
  .high-durability {
    background-color: #4caf50;
  }
  
  .medium-durability {
    background-color: #ff9800;
  }
  
  .low-durability {
    background-color: #f44336;
  }
  
  .no-weapon {
    color: #999;
    font-style: italic;
    padding: 0.75rem;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .equipment-section {
      grid-template-columns: 1fr;
    }
  }
</style>