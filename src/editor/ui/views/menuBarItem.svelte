<script lang="ts">
  import ContextMenu from "./components/contextMenu.svelte";
  import { getApp } from "../../core/application";
  import type { MenuItem } from "./components/menu";

  export let item: MenuItem;

  const app = getApp();

  let container: HTMLElement;
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<a bind:this={container} on:mousedown={(e) => app.openContextMenuFromEvent(e)}>
  {item.label}
  {#if item.menu}
    <ContextMenu menu={item.menu} {container} />
  {/if}
</a>

<style>
  a {
    display: inline-block;
    padding: 0 10px;
    padding-top: 2px;
    font-size: 12px;
    cursor: default;
    user-select: none;
    color: #ccc;
  }

  a:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  a:active {
    color: white;
  }
</style>
