<!-- StatItem.svelte - Reusable stat item component -->
<script>
  export let icon = '';
  export let label = '';
  export let value = '';
</script>

<div class="stat-item">
  {#if icon}
    <span class="stat-icon">{icon}</span>
  {/if}
  {#if label}
    <span class="stat-label">{label}</span>
  {/if}
  <span class="stat-value">{value}</span>
</div>

<style>
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
</style>