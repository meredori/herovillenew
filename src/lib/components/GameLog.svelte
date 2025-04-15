<!-- GameLog.svelte - Game log component for displaying game events -->
<script>
  import { logs } from '../core/gameStore.js';
</script>

<div class="game-log-container">
  <h3 class="log-title">Game Log</h3>
  
  <div class="log-entries">
    {#if !$logs || $logs.length === 0}
      <p class="empty-log">Game events will appear here.</p>
    {:else}
      {#each $logs as entry (entry.id)}
        <div class="log-entry">
          <span class="log-time">{entry.timestamp}</span>
          <span class="log-text">{entry.text}</span>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .game-log-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .log-title {
    margin-top: 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #ddd;
  }
  
  .log-entries {
    flex-grow: 1;
    overflow-y: auto;
    font-size: 0.9rem;
  }
  
  .empty-log {
    color: #888;
    font-style: italic;
  }
  
  .log-entry {
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .log-time {
    font-size: 0.8rem;
    color: #666;
    margin-right: 0.5rem;
  }
  
  .log-text {
    display: block;
    margin-top: 0.2rem;
  }
</style>