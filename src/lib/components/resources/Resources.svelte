<!-- Resources.svelte - Compact component for displaying player resources -->
<script>
  import gameStore from '../../core/gameStore.js';
  import { resources, buildings } from '../../core/gameStore.js';
  
  // Resource information with visibility conditions
  const resourceInfo = {
    materials: { 
      label: "Materials", 
      description: "Gathered resource. Click to gather more.", 
      icon: "🧱", 
      clickable: true,
      alwaysVisible: true
    },
    monsterParts: { 
      label: "Monster Parts", 
      description: "Looted resource from monster battles.", 
      icon: "🦴", 
      clickable: false,
      alwaysVisible: false
    },
    gold: { 
      label: "Gold", 
      description: "Currency earned from quests and dungeons.", 
      icon: "🪙", 
      clickable: false,
      alwaysVisible: false
    }
  };
  
  // Handle material gathering
  function gatherMaterials() {
    gameStore.update(game => {
      if (game && typeof game.gatherMaterials === 'function') {
        game.gatherMaterials();
      }
      return game;
    });
  }
  
  // Tooltips visibility state
  let activeTooltip = null;
  
  function showTooltip(resourceName) {
    activeTooltip = resourceName;
  }
  
  function hideTooltip() {
    activeTooltip = null;
  }
  
  // Check if tent is built (shows additional resources)
  $: hasTent = $buildings?.some(b => b.id === 'tent' && b.level > 0) || false;
  
  // Filter resources based on visibility conditions
  $: visibleResources = Object.entries($resources).filter(([resourceName, _]) => {
    const info = resourceInfo[resourceName] || {};
    return info.alwaysVisible || hasTent;
  });
</script>

<div class="resources-bar">
  <div class="resources-container">
    {#each visibleResources as [resourceName, amount]}
      {@const info = resourceInfo[resourceName] || { label: resourceName, description: "", icon: "📦", clickable: false }}
      <div 
        class="resource-item {info.clickable ? 'clickable' : ''}"
        on:click={info.clickable ? gatherMaterials : null}
        on:mouseenter={() => showTooltip(resourceName)} 
        on:mouseleave={hideTooltip}
      >
        <span class="resource-icon">{info.icon}</span>
        <div class="resource-text">
          <span class="resource-name">{info.label}</span>
          <span class="resource-amount">{amount}</span>
        </div>
        
        {#if activeTooltip === resourceName}
          <div class="tooltip">
            <div class="tooltip-title">{info.label}</div>
            <div class="tooltip-description">{info.description}</div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .resources-bar {
    display: flex;
    align-items: center;
    background: linear-gradient(90deg, #f6edd9 0%, #f3e9d2 100%);
    border: 3px solid #bfa76a;
    border-radius: 0.75rem;
    padding: 0.5rem 1rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 6px rgba(80,60,20,0.15);
    width: 100%;
    box-sizing: border-box;
  }

  .resources-container {
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    gap: 1rem;
  }

  .resource-item {
    display: flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    background: rgba(243, 233, 210, 0.5);
    border: 2px solid #bfa76a;
    border-radius: 0.5rem;
    position: relative;
    min-width: 120px;
    /* Prevent text selection */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  .resource-item.clickable {
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
  }

  .resource-item.clickable:hover {
    background: rgba(243, 233, 210, 0.8);
    box-shadow: 0 2px 6px rgba(80,60,20,0.2);
    transform: translateY(-2px);
  }

  .resource-item.clickable:active {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(80,60,20,0.1);
  }

  .resource-icon {
    font-size: 1.5rem;
    margin-right: 0.5rem;
    filter: drop-shadow(0 1px 0 #bfa76a);
  }

  .resource-text {
    display: flex;
    flex-direction: column;
  }

  .resource-name {
    font-family: var(--font-accent);
    font-weight: bold;
    font-size: 0.85rem;
    color: #7c5e2a;
  }

  .resource-amount {
    font-size: 1.25rem;
    color: #3e2c1c;
    font-family: var(--font-accent);
    line-height: 1.1;
  }

  .tooltip {
    position: absolute;
    bottom: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%);
    background: #fffdf0;
    border: 2px solid #bfa76a;
    border-radius: 0.5rem;
    padding: 0.5rem;
    box-shadow: 0 3px 10px rgba(80,60,20,0.2);
    z-index: 100;
    width: 150px;
    pointer-events: none;
  }

  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: #bfa76a transparent transparent transparent;
  }

  .tooltip-title {
    font-weight: bold;
    color: #7c5e2a;
    margin-bottom: 0.25rem;
    font-family: var(--font-accent);
  }

  .tooltip-description {
    font-size: 0.8rem;
    color: #3e2c1c;
    margin-bottom: 0.25rem;
  }

  .tooltip-action {
    font-size: 0.8rem;
    color: #7c5e2a;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .resources-bar {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>