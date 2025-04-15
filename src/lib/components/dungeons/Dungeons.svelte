<!-- Dungeons.svelte - Component for the Dungeons tab in Heroville -->
<script>
  import gameStore, { dungeons } from '../../core/gameStore.js';
  import { resources, heroes } from '../../core/gameStore.js';
  
  // Handle dungeon discovery
  function discoverDungeon(dungeonId) {
    gameStore.update(game => {
      if (game && game.explorationSystem && typeof game.explorationSystem.discoverDungeon === 'function') {
        game.explorationSystem.discoverDungeon(dungeonId);
      }
      return game;
    });
  }
  
  // Check if player can afford to discover a dungeon
  function canDiscoverDungeon(dungeon) {
    return $resources.gold >= dungeon.discoveryCost;
  }
  
  // Get heroes exploring a specific dungeon
  function getHeroesInDungeon(dungeonId) {
    return $heroes.filter(h => h.status === "exploring" && h.dungeonId === dungeonId);
  }
  
  // Get string representation of dungeon difficulty with stars
  function getDifficultyStars(difficulty) {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  }
</script>

<div class="dungeons-container">
  <h2>Dungeons</h2>
  
  <div class="dungeons-list" id="dungeons-list">
    {#if $dungeons.length > 0}
      {#each $dungeons as dungeon}
        {#if dungeon.discovered}
          <!-- Discovered Dungeon -->
          <div class="dungeon">
            <div class="dungeon-header">
              <h3>{dungeon.name}</h3>
              <div class="dungeon-difficulty" title="Dungeon Difficulty: {dungeon.difficulty}/5">
                {getDifficultyStars(dungeon.difficulty)}
              </div>
            </div>
            
            <p class="dungeon-description">{dungeon.description}</p>
            
            <div class="dungeon-stats">
              <div class="stat-item">
                <span class="stat-icon">🗺️</span>
                <span class="stat-label">Length:</span>
                <span class="stat-value">{dungeon.length} steps</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">⚔️</span>
                <span class="stat-label">Encounter Rate:</span>
                <span class="stat-value">{Math.floor(dungeon.encounterRate * 100)}%</span>
              </div>
            </div>
            
            <div class="dungeon-monsters">
              <div class="monster-info">
                <h4><span class="monster-icon">👹</span> Common Monsters</h4>
                <p class="monster-type">{dungeon.monsterType}</p>
              </div>
              
              {#if dungeon.variant}
                <div class="boss-info">
                  <h4><span class="monster-icon">👑</span> Final Boss</h4>
                  <p class="monster-type">
                    {dungeon.variant.isPrefix ? 
                      `${dungeon.variant.name} ${dungeon.monsterType}` : 
                      `${dungeon.monsterType} ${dungeon.variant.name}`}
                  </p>
                </div>
              {/if}
            </div>
            
            <!-- Hero exploration section with fixed @const -->
            {#if true}
              {@const heroesExploring = getHeroesInDungeon(dungeon.id)}
              {#if heroesExploring.length > 0}
                <div class="dungeon-heroes">
                  <h4><span class="hero-icon">🦸</span> Explorers</h4>
                  <ul class="hero-list">
                    {#each heroesExploring as hero}
                      {@const heroInfo = hero.getDisplayInfo()}
                      {@const healthPercent = (parseInt(heroInfo.health.split('/')[0]) / parseInt(heroInfo.health.split('/')[1])) * 100}
                      <li>
                        {heroInfo.name} 
                        {#if hero.inCombat}<span class="combat-indicator">⚔️</span>{/if}
                        <span class="hero-health-mini">
                          <span class="health-fill" style="width: {healthPercent}%"></span>
                        </span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            {/if}
            
            <div class="dungeon-actions">
              <p class="auto-explore-note">
                <span class="note-icon">📝</span> 
                Heroes explore and leave dungeons automatically
              </p>
            </div>
          </div>
        {:else}
          <!-- Undiscovered Dungeon -->
          <div class="dungeon dungeon-undiscovered">
            <div class="dungeon-header">
              <h3><span class="mystery-icon">❓</span> Undiscovered Location</h3>
            </div>
            
            <p class="dungeon-description">
              This area appears to be hidden. Send scouts to discover what lies here.
            </p>
            
            <div class="discovery-info">
              <p>
                <span class="cost-icon">🪙</span> Discovery Cost: 
                <span class="cost-value">
                  {dungeon.discoveryCost === 0 ? "Free" : `${dungeon.discoveryCost} gold`}
                </span>
              </p>
              
              <button 
                class="discover-button" 
                disabled={!canDiscoverDungeon(dungeon)}
                on:click={() => discoverDungeon(dungeon.id)}
              >
                <span class="button-icon">🔍</span> Discover Location
              </button>
            </div>
          </div>
        {/if}
      {/each}
    {:else}
      <div class="info-message">
        <p>No potential dungeon locations have been found yet.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .dungeons-container {
    padding: 0.5rem;
  }
  
  h2 {
    margin-top: 0;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
  }
  
  .dungeons-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .dungeon {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .dungeon:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .dungeon-undiscovered {
    background-color: #f8f8f8;
    border: 2px dashed #ccc;
  }
  
  .dungeon-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .dungeon-header h3 {
    margin: 0;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
  }
  
  .mystery-icon {
    background-color: #e6f0ff;
    color: #4a83ff;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }
  
  .dungeon-difficulty {
    font-size: 0.8rem;
    color: #ffc107;
    letter-spacing: 1px;
  }
  
  .dungeon-description {
    color: #555;
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }
  
  .dungeon-stats {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #f8f8f8;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.9rem;
  }
  
  .stat-icon {
    font-size: 1.1rem;
  }
  
  .stat-label {
    color: #666;
  }
  
  .stat-value {
    font-weight: bold;
  }
  
  .dungeon-monsters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .monster-info, .boss-info {
    background-color: #f8f8f8;
    border-radius: 0.25rem;
    padding: 0.75rem;
  }
  
  .monster-info h4, .boss-info h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    display: flex;
    align-items: center;
  }
  
  .monster-icon {
    margin-right: 0.5rem;
  }
  
  .monster-type {
    margin: 0;
    font-weight: bold;
    color: #555;
  }
  
  .monster-stats-list {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0 0;
    font-size: 0.9rem;
  }
  
  .monster-stats-list li {
    margin-bottom: 0.25rem;
  }
  
  .dungeon-heroes {
    margin: 1rem 0;
    padding: 0.75rem;
    background-color: #f0f7ff;
    border-radius: 0.25rem;
  }
  
  .dungeon-heroes h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    display: flex;
    align-items: center;
    color: #4a83ff;
  }
  
  .hero-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .hero-list li {
    display: flex;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .combat-indicator {
    margin-left: 0.5rem;
    font-size: 0.8rem;
  }
  
  .hero-health-mini {
    margin-left: auto;
    width: 60px;
    height: 6px;
    background-color: #ddd;
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }
  
  .hero-health-mini .health-fill {
    position: absolute;
    height: 100%;
    background-color: #4caf50;
    left: 0;
    top: 0;
  }
  
  .discovery-info {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #f9f9f9;
    border-radius: 0.25rem;
  }
  
  .cost-value {
    font-weight: bold;
  }
  
  .discover-button {
    width: 100%;
    padding: 0.75rem;
    background-color: #4a83ff;
    color: white;
    border: none;
    border-radius: 0.25rem;
    margin-top: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .discover-button:hover:not([disabled]) {
    background-color: #3a6cd9;
  }
  
  .discover-button[disabled] {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .dungeon-actions {
    margin-top: 1rem;
  }
  
  .auto-explore-note {
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
    display: flex;
    align-items: center;
    margin: 0;
  }
  
  .note-icon {
    margin-right: 0.5rem;
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
    .dungeon-monsters {
      grid-template-columns: 1fr;
    }
  }
</style>