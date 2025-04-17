<!-- ProgressBar.svelte - Reusable progress bar component -->
<script>
  export let value = 0; // Current value (0-100)
  export let height = "0.5rem";
  export let backgroundColor = "#eee";
  export let color = "#4caf50"; // Default green

  // Optional status-based coloring
  export let showStatusColors = false;
  export let highThreshold = 66; // Above this % is "high" (green)
  export let mediumThreshold = 33; // Above this % is "medium" (orange), below is "low" (red)

  // Compute color based on value
  $: progressColor = showStatusColors ? 
    (value > highThreshold ? "#4caf50" : // Green 
     value > mediumThreshold ? "#ff9800" : // Orange
     "#f44336") : // Red 
    color;
</script>

<div class="progress-bar" style="height: {height}; background-color: {backgroundColor};">
  <div 
    class="progress-fill" 
    style="width: {Math.max(0, Math.min(100, value))}%; background-color: {progressColor};"
  ></div>
</div>

<style>
  .progress-bar {
    width: 100%;
    border-radius: 0.25rem;
    overflow: hidden;
    margin: 0.25rem 0;
  }
  
  .progress-fill {
    height: 100%;
    transition: width 0.3s, background-color 0.3s;
  }
</style>