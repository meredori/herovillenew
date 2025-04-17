<!-- Heroes.svelte - Component for the Heroes tab in Heroville -->
<script>
  import { heroes, dungeons } from '../../core/gameStore.js';
  import { Consumables } from '../../entities/consumable.js';
  import { onMount } from 'svelte';
  
  // Import shared components
  import HeroCard from '../shared/HeroCard.svelte';
  import ProgressBar from '../shared/ProgressBar.svelte';
  import StatItem from '../shared/StatItem.svelte';

  // Track the currently selected hero
  let selectedHeroId = null;
  let selectedHero = null;

  // Select first hero by default when the component mounts
  onMount(() => {
    if ($heroes && $heroes.length > 0) {
      selectHero($heroes[0].id);
    }
  });

  // Update selected hero when heroes store changes
  $: {
    if ($heroes && $heroes.length > 0) {
      if (selectedHeroId === null) {
        selectHero($heroes[0].id);
      } else {
        // Make sure the selected hero still exists
        const heroExists = $heroes.some(h => h.id === selectedHeroId);
        if (!heroExists && $heroes.length > 0) {
          selectHero($heroes[0].id);
        } else if (heroExists) {
          selectedHero = $heroes.find(h => h.id === selectedHeroId);
        }
      }
    } else {
      selectedHeroId = null;
      selectedHero = null;
    }
  }

  // Function to select a hero
  function selectHero(heroId) {
    selectedHeroId = heroId;
    selectedHero = $heroes.find(h => h.id === heroId);
  }

  // Helper to get combat details for a hero
  function getCombatDetails(hero, $dungeons) {
    if (!hero.inCombat || !hero.dungeonId) return null;
    const dungeon = $dungeons.find(d => d.id === hero.dungeonId);
    if (!dungeon) return null;
    const explorer = dungeon.getExplorerProgress(hero.id);
    if (!explorer || !explorer.currentMonster) return null;
    return {
      monsterName: explorer.currentMonster.name,
      monsterHealth: `${explorer.currentMonster.health}/${explorer.currentMonster.maxHealth}`,
      isVariant: explorer.currentMonster.isVariant,
      combatRound: explorer.combatRound || 1,
      monsterDamage: `${explorer.currentMonster.minDamage}-${explorer.currentMonster.maxDamage}`
    };
  }

  // Helper to get status color class
  function getStatusClass(status) {
    return {
      idle: 'status-idle',
      exploring: 'status-exploring',
      healing: 'status-healing'
    }[status] || 'status-idle';
  }

  // Helper to get a human-readable status label
  function getStatusLabel(hero) {
    if (hero.status === 'idle') return 'Idle';
    if (hero.status === 'healing') return 'Healing';
    if (hero.status === 'exploring') {
      if (hero.inCombat) return 'In Combat';
      return 'Exploring';
    }
    return hero.status;
  }
  
  // Get hero theme color based on status
  function getHeroThemeColor(status) {
    if (status === 'exploring') return '#4a83ff';
    if (status === 'healing') return '#ff4a83';
    return '#7c7c7c'; // idle
  }
</script>

<div class="heroes-container">
  <h2>Heroes</h2>
  
  {#if $heroes.length > 0}
    <div class="heroes-layout">
      <!-- Heroes List (left side) -->
      <div class="heroes-list">
        {#each $heroes as hero}
          {@const heroInfo = hero.getDisplayInfo()}
          {@const healthPercent = parseInt(heroInfo.health.split('/')[0]) / parseInt(heroInfo.health.split('/')[1]) * 100}
          
          <div 
            class="hero-list-item {hero.id === selectedHeroId ? 'selected' : ''} hero-{hero.status}"
            on:click={() => selectHero(hero.id)}
          >
            <div class="hero-list-header">
              <h3>{heroInfo.name}</h3>
              <div class="hero-status {getStatusClass(hero.status)}">
                {getStatusLabel(hero)}
              </div>
            </div>
            
            <div class="hero-list-stats">
              <div class="hero-health">
                <ProgressBar value={healthPercent} />
                <div class="health-value">{heroInfo.health}</div>
              </div>
              
              <div class="hero-list-meta">
                <span class="level-badge">LVL {heroInfo.level}</span>
                <span class="damage-badge">DMG {heroInfo.damage}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Hero Details (right side) -->
      {#if selectedHero}
        {@const heroInfo = selectedHero.getDisplayInfo()}
        {@const themeColor = getHeroThemeColor(selectedHero.status)}
        
        <div class="hero-details-container">
          <div class="character-sheet">
            <!-- Header section with hero name and basic info -->
            <div class="character-header">
              <div class="character-title">
                <h3>{heroInfo.name}</h3>
                <div class="hero-status-badge {getStatusClass(selectedHero.status)}">{getStatusLabel(selectedHero)}</div>
              </div>
              
              <div class="character-vitals">
                <div class="vital-item">
                  <div class="vital-label">Level</div>
                  <div class="vital-value">{heroInfo.level}</div>
                </div>
                <div class="vital-item">
                  <div class="vital-label">Health</div>
                  <div class="vital-value">{heroInfo.health}</div>
                </div>
                <div class="vital-item">
                  <div class="vital-label">XP</div>
                  <div class="vital-value">{heroInfo.experience}/{heroInfo.level * 100}</div>
                </div>
              </div>
              
              <div class="health-bar">
                {#if typeof heroInfo.health === 'string'}
                  {@const [current, max] = heroInfo.health.split('/').map(Number)}
                  {@const healthPercent = (current / max) * 100}
                  <ProgressBar value={healthPercent} color="#4caf50" />
                {/if}
              </div>
            </div>
            
            <!-- Main character sheet grid -->
            <div class="character-sheet-grid">
              <!-- Stats section -->
              <div class="character-section">
                <div class="section-header">
                  <h4>Character Stats</h4>
                </div>
                <div class="stats-grid">
                  <div class="stat-block">
                    <div class="stat-icon">⚔️</div>
                    <div class="stat-details">
                      <div class="stat-name">Damage</div>
                      <div class="stat-value">{heroInfo.damage || 'Unknown'}</div>
                    </div>
                  </div>
                  
                  <div class="stat-block">
                    <div class="stat-icon">🏃</div>
                    <div class="stat-details">
                      <div class="stat-name">Class</div>
                      <div class="stat-value">{heroInfo.class || 'Adventurer'}</div>
                    </div>
                  </div>
                  
                  <div class="stat-block">
                    <div class="stat-icon">📊</div>
                    <div class="stat-details">
                      <div class="stat-name">Kills</div>
                      <div class="stat-value">{selectedHero.stats?.kills || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Combat/Status section - always visible -->
              <div class="character-section">
                <div class="section-header">
                  <h4>Status & Combat</h4>
                </div>
                
                {#if selectedHero.inCombat}
                  <!-- Combat Information -->
                  {@const combatDetails = getCombatDetails(selectedHero, $dungeons)}
                  {#if combatDetails}
                    <div class="combat-information">
                      <div class="combat-header">
                        <div class="combat-icon">⚔️</div>
                        <div class="combat-title">In Combat</div>
                        <div class="combat-round">Round {combatDetails.combatRound}</div>
                      </div>
                      
                      <div class="enemy-details">
                        <div class="enemy-name">
                          {combatDetails.monsterName} {combatDetails.isVariant ? '(Boss)' : ''}
                        </div>
                        
                        <div class="enemy-health">
                          {#if combatDetails.monsterHealth}
                            {@const [current, max] = combatDetails.monsterHealth.split('/').map(Number)}
                            {@const healthPercent = (current / max) * 100}
                            <div class="health-label">
                              <span>Enemy Health:</span>
                              <span>{combatDetails.monsterHealth}</span>
                            </div>
                            <ProgressBar value={healthPercent} color="#ff7043" />
                          {/if}
                        </div>
                        
                        <div class="enemy-stats">
                          <div class="enemy-stat">
                            <span class="enemy-stat-label">DMG:</span>
                            <span class="enemy-stat-value">{combatDetails.monsterDamage}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/if}
                {:else if selectedHero.status === 'exploring'}
                  <!-- Exploration Information -->
                  {@const dungeon = $dungeons.find(d => d.id === selectedHero.dungeonId)}
                  {#if dungeon}
                    <div class="exploration-information">
                      <div class="exploration-header">
                        <div class="exploration-icon">🗺️</div>
                        <div class="exploration-title">Exploring Dungeon</div>
                      </div>
                      
                      <div class="dungeon-details">
                        <div class="dungeon-name">{dungeon.name}</div>
                        <div class="dungeon-progress">
                          <div class="progress-label">Progress: {selectedHero.dungeonProgress}/10</div>
                          <ProgressBar value={(selectedHero.dungeonProgress / 10) * 100} color="#4a83ff" />
                        </div>
                        
                        {#if selectedHero.dungeonSuccessChance !== null}
                          <div class="success-chance">
                            <div class="chance-label">Success Chance:</div>
                            <div class="chance-value">
                              {#if selectedHero.dungeonSuccessChance > 75}
                                <span class="chance high-chance">{selectedHero.dungeonSuccessChance}%</span>
                              {:else if selectedHero.dungeonSuccessChance > 50}
                                <span class="chance medium-chance">{selectedHero.dungeonSuccessChance}%</span>
                              {:else if selectedHero.dungeonSuccessChance > 25}
                                <span class="chance low-chance">{selectedHero.dungeonSuccessChance}%</span>
                              {:else}
                                <span class="chance very-low-chance">{selectedHero.dungeonSuccessChance}%</span>
                              {/if}
                            </div>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/if}
                {:else if selectedHero.status === 'healing'}
                  <!-- Healing Information -->
                  <div class="healing-information">
                    <div class="healing-header">
                      <div class="healing-icon">❤️</div>
                      <div class="healing-title">Healing</div>
                    </div>
                    
                    <div class="healing-details">
                      <p>This hero is currently resting to recover health.</p>
                      <p class="healing-estimate">Healing at approximately 1 HP per game tick.</p>
                    </div>
                  </div>
                {:else}
                  <!-- Idle Information -->
                  <div class="idle-information">
                    <div class="idle-header">
                      <div class="idle-icon">💤</div>
                      <div class="idle-title">Idle</div>
                    </div>
                    
                    <div class="idle-details">
                      <p>This hero is currently idle in town.</p>
                      <p class="idle-estimate">Will automatically choose an action when ready.</p>
                    </div>
                  </div>
                {/if}
              </div>
              
              <!-- Equipment section -->
              <div class="character-section">
                <div class="section-header">
                  <h4>Equipment</h4>
                </div>
                <div class="equipment-slots">
                  <div class="equipment-slot">
                    <div class="slot-icon">⚔️</div>
                    <div class="slot-details">
                      <div class="slot-name">Weapon</div>
                      <div class="slot-value">
                        {#if heroInfo.equipment?.weapon}
                          {heroInfo.equipment.weapon.name}
                          {#if heroInfo.equipment.weapon.durability !== undefined}
                            <span class="durability">
                              ({heroInfo.equipment.weapon.durability}/{heroInfo.equipment.weapon.maxDurability})
                            </span>
                          {/if}
                        {:else}
                          None
                        {/if}
                      </div>
                      {#if heroInfo.equipment?.weapon}
                        <div class="slot-stats">DMG: {heroInfo.equipment.weapon.minDamage}-{heroInfo.equipment.weapon.maxDamage}</div>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="equipment-slot">
                    <div class="slot-icon">🛡️</div>
                    <div class="slot-details">
                      <div class="slot-name">Armor</div>
                      <div class="slot-value">{heroInfo.equipment?.armor || 'None'}</div>
                    </div>
                  </div>
                  
                  <div class="equipment-slot">
                    <div class="slot-icon">💍</div>
                    <div class="slot-details">
                      <div class="slot-name">Accessory</div>
                      <div class="slot-value">{heroInfo.equipment?.accessory || 'None'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Inventory section -->
              <div class="character-section">
                <div class="section-header">
                  <h4>Inventory</h4>
                </div>
                <div class="inventory-slots">
                  <div class="inventory-row">
                    <div class="inventory-icon">🪙</div>
                    <div class="inventory-name">Gold</div>
                    <div class="inventory-value">{heroInfo.inventory?.gold || 0}</div>
                  </div>
                  
                  <div class="inventory-row">
                    <div class="inventory-icon">🦴</div>
                    <div class="inventory-name">Monster Parts</div>
                    <div class="inventory-value">{heroInfo.inventory?.monsterParts || 0}</div>
                  </div>
                  
                  {#if heroInfo.inventory?.potions && typeof heroInfo.inventory.potions === 'object'}
                    {#each Object.entries(heroInfo.inventory.potions) as [potionId, qty]}
                      {#if qty > 0}
                        <div class="inventory-row">
                          <div class="inventory-icon">🧪</div>
                          <div class="inventory-name">{potionId}</div>
                          <div class="inventory-value">{qty}</div>
                        </div>
                      {/if}
                    {/each}
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="info-message">
      <p>No heroes have joined your village yet. Upgrade your tent to attract heroes!</p>
    </div>
  {/if}
</div>

<style>
  .heroes-container {
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

  /* Layout for list-detail view */
  .heroes-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 2rem;
    height: calc(100vh - 180px);
    max-height: 800px;
  }
  
  /* Heroes List (left side) */
  .heroes-list {
    background-color: #f8f8f8;
    border-radius: 0.5rem;
    overflow-y: auto;
    border: 1px solid #ddd;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .hero-list-item {
    padding: 0.75rem;
    border-bottom: 1px solid #eee;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .hero-list-item:hover {
    background-color: #f0f8ff;
  }
  
  .hero-list-item.selected {
    background-color: #e6f0ff;
    border-left: 4px solid #4a83ff;
  }
  
  .hero-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .hero-list-header h3 {
    margin: 0;
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .hero-list-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .hero-health {
    width: 100%;
  }
  
  .hero-list-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
  }
  
  .level-badge, .damage-badge {
    display: inline-block;
    padding: 0.15rem 0.35rem;
    border-radius: 0.25rem;
    font-weight: bold;
  }
  
  .level-badge {
    background-color: #e6f0ff;
    color: #4a83ff;
  }
  
  .damage-badge {
    background-color: #ffe6f0;
    color: #ff4a83;
  }
  
  /* Hero Details (right side) */
  .hero-details-container {
    overflow-y: auto;
  }
  
  .character-sheet {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background-color: #fff;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .character-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .character-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .hero-status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: bold;
    font-size: 0.85rem;
  }
  
  .character-vitals {
    display: flex;
    gap: 1rem;
  }
  
  .vital-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f8f8f8;
    border-radius: 0.25rem;
    padding: 0.5rem;
    flex: 1;
  }
  
  .vital-label {
    font-size: 0.75rem;
    color: #666;
  }
  
  .vital-value {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .health-bar {
    margin-top: 0.5rem;
  }
  
  .character-sheet-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .character-section {
    background-color: #f8f8f8;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  
  .section-header {
    margin-bottom: 0.5rem;
  }
  
  .section-header h4 {
    margin: 0;
    font-size: 1.1rem;
    color: #4a83ff;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  .stat-block {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 0.25rem;
    padding: 0.5rem;
  }
  
  .stat-icon {
    margin-right: 0.5rem;
    font-size: 1.25rem;
  }
  
  .stat-details {
    display: flex;
    flex-direction: column;
  }
  
  .stat-name {
    font-size: 0.85rem;
    color: #666;
  }
  
  .stat-value {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .combat-information {
    background-color: #fff3e0;
    border-radius: 0.25rem;
    padding: 0.75rem;
    border-left: 4px solid #ff7043;
  }
  
  .combat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .combat-icon {
    font-size: 1.25rem;
  }
  
  .combat-title {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .combat-round {
    font-size: 0.85rem;
    color: #666;
  }
  
  .enemy-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .enemy-name {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .enemy-health {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .health-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #666;
  }
  
  .enemy-stats {
    display: flex;
    gap: 1rem;
  }
  
  .enemy-stat {
    display: flex;
    gap: 0.25rem;
  }
  
  .enemy-stat-label {
    font-weight: bold;
    color: #ff7043;
  }
  
  .enemy-stat-value {
    font-weight: bold;
  }
  
  .exploration-information {
    background-color: #e3f2fd;
    border-radius: 0.25rem;
    padding: 0.75rem;
    border-left: 4px solid #4a83ff;
  }
  
  .exploration-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .exploration-icon {
    font-size: 1.25rem;
    margin-right: 0.5rem;
  }
  
  .exploration-title {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .dungeon-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .dungeon-name {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .dungeon-progress {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .progress-label {
    font-size: 0.85rem;
    color: #666;
  }
  
  .success-chance {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .chance-label {
    font-size: 0.85rem;
    color: #666;
  }
  
  .chance-value {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .chance {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
  
  .high-chance {
    background-color: #c8e6c9;
    color: #388e3c;
  }
  
  .medium-chance {
    background-color: #fff9c4;
    color: #fbc02d;
  }
  
  .low-chance {
    background-color: #ffe0b2;
    color: #f57c00;
  }
  
  .very-low-chance {
    background-color: #ffcdd2;
    color: #d32f2f;
  }
  
  .healing-information {
    background-color: #fce4ec;
    border-radius: 0.25rem;
    padding: 0.75rem;
    border-left: 4px solid #ff4a83;
  }
  
  .healing-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .healing-icon {
    font-size: 1.25rem;
    margin-right: 0.5rem;
  }
  
  .healing-title {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .healing-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .healing-estimate {
    font-size: 0.85rem;
    color: #666;
  }
  
  .idle-information {
    background-color: #f5f5f5;
    border-radius: 0.25rem;
    padding: 0.75rem;
    border-left: 4px solid #7c7c7c;
  }
  
  .idle-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .idle-icon {
    font-size: 1.25rem;
    margin-right: 0.5rem;
  }
  
  .idle-title {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .idle-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .idle-estimate {
    font-size: 0.85rem;
    color: #666;
  }
  
  .equipment-slots {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .equipment-slot {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 0.25rem;
    padding: 0.5rem;
  }
  
  .slot-icon {
    font-size: 1.25rem;
    margin-right: 0.5rem;
  }
  
  .slot-details {
    display: flex;
    flex-direction: column;
  }
  
  .slot-name {
    font-size: 0.85rem;
    color: #666;
  }
  
  .slot-value {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .slot-stats {
    font-size: 0.85rem;
    color: #666;
  }
  
  .durability {
    font-size: 0.85rem;
    color: #666;
  }
  
  .inventory-slots {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .inventory-row {
    display: flex;
    align-items: center;
    background-color: #fff;
    border-radius: 0.25rem;
    padding: 0.5rem;
  }
  
  .inventory-icon {
    font-size: 1.25rem;
    margin-right: 0.5rem;
  }
  
  .inventory-name {
    flex: 1;
    font-size: 0.85rem;
    color: #666;
  }
  
  .inventory-value {
    font-weight: bold;
    font-size: 1rem;
  }
  
  .info-message {
    padding: 2rem;
    background-color: #f8f8f8;
    border-radius: 0.5rem;
    text-align: center;
    color: #666;
  }
  
  @media (max-width: 768px) {
    .heroes-layout {
      grid-template-columns: 1fr;
    }
    
    .heroes-list {
      max-height: 300px;
    }
    
    .character-sheet-grid {
      grid-template-columns: 1fr;
    }
  }
</style>