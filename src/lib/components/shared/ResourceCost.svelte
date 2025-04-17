<!-- ResourceCost.svelte - Reusable component for displaying resource costs -->
<script>
  export let resourceName = '';
  export let amount = 0;
  export let icon = '';
</script>

<li class="resource-cost">
  {#if icon}
    <span class="resource-icon">{icon}</span>
  {/if}
  <span class="resource-name">{resourceName}: </span>
  <span class="resource-amount">{amount}</span>
</li>

<style>
  .resource-cost {
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
</style>