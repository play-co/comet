<script lang="ts">
  import type { StatusBarItem } from "./statusBar";

  export let item: StatusBarItem;

  const { label } = item.$store;

  $: style = item.width === -1 ? undefined : `width: ${item.width}px`;
</script>

<status-item class:label={item.style === "label"} class:value={item.style === "value"} {style}>
  {#if item.style === "label"}
    {$label}
  {:else if item.style === "value"}
    <pre>{$label}</pre>
  {/if}
</status-item>

<style>
  status-item {
    flex-grow: 0;
    font-family: monospace;
    white-space: nowrap;
    margin: 0 5px;
  }

  status-item.label {
    text-align: right;
    color: #999;
  }

  status-item.value {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    min-width: 20px;
    color: #bbb;
  }

  pre {
    text-align: center;
  }
</style>
