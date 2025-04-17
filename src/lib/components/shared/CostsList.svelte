<!-- CostsList.svelte - Reusable component for displaying a list of costs -->
<script>
  export let title = "Cost:";
</script>

<div class="costs-container">
  <p class="costs-title">{title}</p>
  <ul class="cost-list">
    <slot></slot>
  </ul>
</div>

<style>
  .costs-container {
    margin-bottom: 1rem;
  }
  
  .costs-title {
    margin: 0 0 0.5rem 0;
    font-weight: bold;
    color: #666;
  }
  
  .cost-list {
    list-style: none;
    padding: 0;
    margin: 0 0 0.5rem 0;
  }
</style>