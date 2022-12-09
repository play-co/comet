<script lang="ts">
  import { onMount } from "svelte";
  import type { Menu } from "./menu";

  export let menu: Menu;
  export let event: MouseEvent | undefined;
  export let target: HTMLElement;

  let container: HTMLElement;
  let x = 0;
  let y = 0;
  let contains = false;

  $: {
    if (event) {
      x = event.clientX;
      y = event.clientY;
    }
  }

  $: {
    if (event && target.contains(event.target as HTMLElement)) {
      contains = true;
    } else {
      contains = false;
    }
  }

  onMount(() => {
    window.addEventListener("mousedown", (e: MouseEvent) => {
      if (container && !container.contains(e.target as HTMLElement)) {
        event = undefined;
      }
    });
  });
</script>

{#if event && contains}
  <popup-menu bind:this={container} style={`left:${x}px;top:${y}px;`}>
    {#each menu.items as item}
      <menu-item>{item.label}</menu-item>
    {/each}
  </popup-menu>
{/if}

<style>
  popup-menu {
    position: fixed;
    top: 0;
    left: 0;
    background: #666;
    color: white;
    z-index: 1000;
    display: flex;
    flex-direction: column;
  }

  menu-item {
    border: 1px outset #828282;
    padding: 0 10px;
    font-size: 12px;
    cursor: default;
  }

  menu-item:hover {
    background: #8f8f8f;
  }
</style>
