<script lang="ts">
  import ContextMenu from "./components/contextMenu.svelte";
  import { getApp } from "../../core/application";
  import type { MenuItem } from "./components/menu";
  import { createEventDispatcher } from "svelte";

  export let item: MenuItem;
  export let selected: boolean;

  const app = getApp();
  const dispatch = createEventDispatcher();

  let container: HTMLElement;

  const onMouseDown = (e: MouseEvent) => {
    app.openContextMenuFromEvent(e);
    dispatch("select", item);
  };
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<a
  bind:this={container}
  on:mousedown={onMouseDown}
  on:mouseover={() => dispatch("mouseover", item)}
  class:selected
>
  {item.label}
  {#if item.menu}
    <ContextMenu menu={item.menu} {container} anchorElement={container} on:close />
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

  a:hover,
  a.selected {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
</style>
