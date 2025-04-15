<!-- Heroes.svelte - Component for the Heroes tab in Heroville -->
<script>
  import { heroes, dungeons } from '../../core/gameStore.js';
  import { Consumables } from '../../entities/consumable.js';

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
</script>

<div class="heroes-container">
  <h2>Heroes</h2>
  
  <div class="heroes-list" id="heroes-list">
    {#if $heroes.length > 0}
      {#each $heroes as hero}
        {@const heroInfo = hero.getDisplayInfo()}
        {@const healthPercent = parseInt(heroInfo.health.split('/')[0]) / parseInt(heroInfo.health.split('/')[1]) * 100}
        
        <div class="hero hero-{hero.status}">
          <div class="hero-header">
            <h3>{heroInfo.name}</h3>
            <div class="hero-status status-{hero.status}">
              {#if hero.status === 'idle'}
                Idle
              {:else if hero.status === 'exploring'}
                {#if hero.inCombat}
                  Exploring ({#if hero.dungeonId}
                    {$heroes.find(h => h.id === hero.id)?.dungeonId ? 'In Combat' : ''}
                  {/if})
                {:else}
                  Exploring
                {/if}
              {:else if hero.status === 'healing'}
                Healing
              {/if}
            </div>
          </div>
          
          <div class="hero-health">
            <div class="stat-label">Health:</div>
            <div class="health-value">{heroInfo.health}</div>
            <div class="progress-bar">
              <div class="progress-fill health-fill" style="width: {healthPercent}%"></div>
            </div>
          </div>
          
          {#if hero.status === 'exploring' && hero.dungeonId}
            {@const dungeon = hero.dungeonId}
            <div class="hero-dungeon-progress">
              <p><strong>Exploring:</strong> {dungeon}</p>
              <p>Progress: {hero.dungeonProgress}</p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: {(hero.dungeonProgress / 10) * 100}%"></div>
              </div>
            </div>
            
            {#if heroInfo.dungeonSuccessChance !== null}
              {@const chanceClass = 
                heroInfo.dungeonSuccessChance > 75 ? 'high-chance' : 
                heroInfo.dungeonSuccessChance > 50 ? 'medium-chance' : 
                heroInfo.dungeonSuccessChance > 25 ? 'low-chance' : 'very-low-chance'}
              <div class="hero-success-chance">
                <p>Success Chance: <span class="chance {chanceClass}">{heroInfo.dungeonSuccessChance}%</span></p>
                <div class="progress-bar">
                  <div class="progress-fill {chanceClass}" style="width: {heroInfo.dungeonSuccessChance}%"></div>
                </div>
              </div>
            {/if}

            {#if hero.inCombat}
              {@const combatDetails = getCombatDetails(hero, $dungeons)}
              {#if combatDetails}
                <div class="hero-combat-details">
                  <h4><span class="combat-icon">⚔️</span> In Combat</h4>
                  <div class="combat-row"><span>Enemy:</span> <span>{combatDetails.monsterName} {combatDetails.isVariant ? '(Boss)' : ''}</span></div>
                  <div class="combat-row"><span>Enemy HP:</span> <span>{combatDetails.monsterHealth}</span></div>
                  <div class="combat-row"><span>Enemy Damage:</span> <span>{combatDetails.monsterDamage}</span></div>
                  <div class="combat-row"><span>Combat Round:</span> <span>{combatDetails.combatRound}</span></div>
                </div>
              {/if}
            {/if}
          {/if}
          
          <div class="hero-stats-grid">
            <div class="stat-item">
              <div class="stat-label">Damage:</div>
              <div class="stat-value">{heroInfo.damage}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Level:</div>
              <div class="stat-value">{heroInfo.level}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">XP:</div>
              <div class="stat-value">{hero.experience}/{hero.level * 100}</div>
            </div>
          </div>

          <div class="hero-sections">
            <div class="hero-equipment">
              <h4><span class="equipment-icon">⚔️</span> Equipment</h4>
              <ul class="equipment-list">
                <li>Weapon: {heroInfo.equipment.weapon}</li>
                <li>Armor: {heroInfo.equipment.armor}</li>
                <li>Accessory: {heroInfo.equipment.accessory}</li>
              </ul>
            </div>
            
            <div class="hero-inventory">
              <h4><span class="inventory-icon">🎒</span> Inventory</h4>
              <ul class="inventory-list">
                <li><span title="Gold" aria-label="Gold">🪙</span> Gold: {heroInfo.inventory.gold}</li>
                <li><span title="Monster Parts" aria-label="Monster Parts">🦴</span> Monster Parts: {heroInfo.inventory.monsterParts}</li>
                {#if heroInfo.inventory.potions}
                  {#each Object.entries(heroInfo.inventory.potions) as [potionId, qty]}
                    {#if qty > 0}
                      {@const potion = Consumables.find(c => c.id === potionId) || null}
                      <li>
                        <span title={potion ? potion.name : potionId} aria-label={potion ? potion.name : potionId}>{potion ? potion.icon : '🧪'}</span>
                        {potion ? potion.name : potionId}: {qty}
                      </li>
                    {/if}
                  {/each}
                {/if}
              </ul>
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <div class="info-message">
        <p>No heroes have joined your village yet. Upgrade your tent to attract heroes!</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .heroes-container {
    padding: 0.5rem;
  }
  
  h2 {
    margin-top: 0;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
  }
  
  .heroes-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .hero {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .hero:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .hero-idle {
    border-left: 4px solid #ccc;
  }
  
  .hero-exploring {
    border-left: 4px solid #4a83ff;
  }
  
  .hero-healing {
    border-left: 4px solid #ff4a83;
  }
  
  .hero-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .hero-header h3 {
    margin: 0;
    font-size: 1.25rem;
  }
  
  .hero-status {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-weight: bold;
  }
  
  .status-idle {
    background-color: #eee;
    color: #666;
  }
  
  .status-exploring {
    background-color: #e6f0ff;
    color: #4a83ff;
  }
  
  .status-healing {
    background-color: #ffe6f0;
    color: #ff4a83;
  }
  
  .hero-health {
    margin-bottom: 0.75rem;
  }
  
  .progress-bar {
    height: 0.5rem;
    background-color: #eee;
    border-radius: 0.25rem;
    overflow: hidden;
    margin-top: 0.25rem;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #4caf50;
  }
  
  .health-fill {
    background-color: #4caf50;
  }
  
  .hero-dungeon-progress {
    margin: 0.75rem 0;
    padding: 0.75rem;
    background-color: #f8f8f8;
    border-radius: 0.25rem;
  }
  
  .hero-dungeon-progress p {
    margin: 0 0 0.5rem 0;
  }
  
  .hero-success-chance {
    margin-bottom: 0.75rem;
  }
  
  .hero-success-chance p {
    margin: 0 0 0.25rem 0;
  }
  
  .chance {
    font-weight: bold;
  }
  
  .high-chance {
    color: #4caf50;
  }
  
  .medium-chance {
    color: #ffab00;
  }
  
  .low-chance {
    color: #ff7043;
  }
  
  .very-low-chance {
    color: #f44336;
  }
  
  .progress-fill.high-chance {
    background-color: #4caf50;
  }
  
  .progress-fill.medium-chance {
    background-color: #ffab00;
  }
  
  .progress-fill.low-chance {
    background-color: #ff7043;
  }
  
  .progress-fill.very-low-chance {
    background-color: #f44336;
  }
  
  .hero-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .stat-item {
    padding: 0.5rem;
    background-color: #f8f8f8;
    border-radius: 0.25rem;
    text-align: center;
  }
  
  .stat-label {
    font-size: 0.8rem;
    color: #666;
  }
  
  .stat-value {
    font-weight: bold;
    font-size: 1.1rem;
  }
    
  .hero-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .hero-equipment, .hero-inventory {
    background-color: #f8f8f8;
    border-radius: 0.25rem;
    padding: 0.75rem;
  }
  
  .hero-equipment h4, .hero-inventory h4 {
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
  
  .hero-combat-details {
    margin: 0.75rem 0;
    padding: 0.75rem;
    background-color: #fff3e0;
    border-radius: 0.25rem;
    border-left: 4px solid #ff7043;
  }
  
  .hero-combat-details h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    display: flex;
    align-items: center;
    color: #ff7043;
  }
  
  .combat-icon {
    margin-right: 0.5rem;
  }
  
  .combat-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }
  
  .info-message {
    grid-column: 1 / -1;
    padding: 2rem;
    background-color: #f8f8f8;
    border-radius: 0.5rem;
    text-align: center;
    color: #666;
  }
  
  @media (max-width: 768px) {
    .hero-sections {
      grid-template-columns: 1fr;
    }
  }
</style>