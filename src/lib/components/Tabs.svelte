<!-- Tabs.svelte - Tab navigation component for Heroville -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  // Component props
  export let visibleTabs = [];
  export let activeTab = '';
  
  // Set up event dispatcher for tab changes
  const dispatch = createEventDispatcher();
  
  // Handle tab click
  function handleTabClick(tabId) {
    dispatch('tabChange', tabId);
  }
</script>

<div class="tabs-container">
  <div class="tabs-nav">
    {#each visibleTabs as tab}
      <button 
        class="tab-button {activeTab === tab.id ? 'active' : ''}" 
        on:click={() => handleTabClick(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .tabs-container {
    margin-bottom: 1rem;
  }
  
  .tabs-nav {
    display: flex;
    border-bottom: 1px solid #ccc;
  }
  
  .tab-button {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #333; /* Ensure text visibility on light backgrounds */
    /* Using the variable from app.css for font consistency */
    font-family: var(--font-accent);
  }
  
  .tab-button:hover {
    background-color: #f0f0f0;
    border-bottom-color: #ccc;
  }
  
  .tab-button.active {
    border-bottom-color: #4a83ff;
    color: #4a83ff;
    font-weight: bold;
  }
</style>