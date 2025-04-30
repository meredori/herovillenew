<!-- ItemCard.svelte - Reusable item card component -->
<script>
  // Item properties
  export let item = {};
  export let name = item.name || 'Item';
  export let description = item.description || '';
  export let stock = 0;
  export let themeColor = '#4a83ff'; // Default blue theme
  export let disabled = false;
  
  // Button properties
  export let buttonText = 'Action';
  export let buttonDisabled = false;
  export let onButtonClick = () => {};
  
  // Custom component slots
  export let showStock = true;
  
  // Stock indicator helper
  export function getStockColor(count) {
    if (count >= 5) return 'high-stock';
    if (count >= 2) return 'medium-stock';
    return 'low-stock';
  }
</script>

<div class="item-card shared-card {disabled ? 'disabled' : ''}" style="--theme-color: {themeColor}">
  <div class="item-header">
    <h4>{name}</h4>
    {#if showStock}
      <div class="item-stock {getStockColor(stock)}">
        Stock: {stock}
      </div>
    {/if}
  </div>
  
  <p class="item-description">{description}</p>
  
  <!-- Stats slot -->
  {#if $$slots.stats}
    <div class="item-stats">
      <slot name="stats"></slot>
    </div>
  {/if}
  
  <!-- Costs slot -->
  {#if $$slots.costs}
    <div class="item-costs">
      <slot name="costs"></slot>
    </div>
  {/if}
  
  <!-- Action button -->
  <button 
    class="action-button"
    disabled={buttonDisabled || disabled}
    on:click={onButtonClick}
  >
    {disabled ? 'Not Available' : buttonText}
  </button>
</div>

<style>
  .item-card:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .item-card.disabled {
    opacity: 0.7;
    border-left-color: #ccc;
  }
  
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .item-header h4 {
    margin: 0;
    color: var(--theme-color);
    font-size: 1.2rem;
  }
  
  .item-stock {
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
  
  .item-description {
    margin-bottom: 1rem;
    color: #555;
  }
  
  .item-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .item-costs {
    margin-bottom: 1rem;
  }
  
  .action-button {
    width: 100%;
    padding: 0.5rem;
    background-color: var(--theme-color);
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    cursor: pointer;
    transition: filter 0.2s;
  }
  
  .action-button:hover:not([disabled]) {
    filter: brightness(110%);
  }
  
  .action-button[disabled] {
    background-color: #ccc;
    cursor: not-allowed;
  }
</style>