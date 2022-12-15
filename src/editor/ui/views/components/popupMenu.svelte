<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Events from "../../../events";
  import type { Menu, MenuItem } from "./menu";

  export let menu: Menu;
  export let event: MouseEvent | undefined;
  export let target: HTMLElement;
  export let isSubMenu = false;

  let show = false;
  let container: HTMLElement;
  let x = 0;
  let y = 0;
  let active: MenuItem | undefined;
  let style: string;

  $: {
    if (event) {
      x = event.clientX;
      y = event.clientY;
    }
  }

  $: style = `left:${isSubMenu ? "calc(100% + 2px)" : `${x}px`};top:${isSubMenu ? 0 : y}px;`;

  $: {
    if (event && target) {
      if (target.contains(event.target as HTMLElement)) {
        show = true;
      } else {
        show = false;
      }
    }
  }

  function close() {
    Events.editor.contextMenuClose.emit();
  }

  const onMouseDown = (e: MouseEvent) => {
    if (container && !container.contains(e.target as HTMLElement)) {
      close();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };

  const onContextMenuClose = () => {
    event = undefined;
  };

  const onMenuItemClick = (item: MenuItem) => {
    if (!item.menu && item.isEnabled !== false) {
      item.onClick && item.onClick(item);
      Events.editor.contextMenuClose.emit();
    }
  };

  onMount(() => {
    if (!isSubMenu) {
      window.addEventListener("mousedown", onMouseDown);
      Events.key.down.bind(onKeyDown);
    }
    Events.editor.contextMenuClose.bind(onContextMenuClose);
  });

  onDestroy(() => {
    if (!isSubMenu) {
      window.removeEventListener("mousedown", onMouseDown);
      Events.key.down.unbind(onKeyDown);
    }
    Events.editor.contextMenuClose.unbind(onContextMenuClose);
  });
</script>

{#if (event && show) || isSubMenu}
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <popup-menu
    bind:this={container}
    class:submenu={isSubMenu}
    {style}
    on:mouseout={() => {
      if (active && active.menu === undefined) active = undefined;
    }}
  >
    {#each menu.getItems() as item}
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <menu-item
        class:selected={item === active}
        class:disabled={item.isEnabled === false}
        on:mouseover={() => (active = item)}
        on:click={() => onMenuItemClick(item)}
      >
        {item.label}
        {#if item.menu && active === item}
          <svelte:self on:select {event} menu={item.menu} target={container} isSubMenu={true} />
        {/if}
      </menu-item>
    {/each}
  </popup-menu>
{/if}

<style>
  popup-menu {
    position: absolute;
    top: 0;
    left: 0;
    background: #454343;
    display: flex;
    flex-direction: column;
    white-space: nowrap;
  }

  popup-menu.submenu {
    position: absolute;
    top: 0px;
    left: 100%;
  }

  menu-item {
    position: relative;
    border: 1px outset #828282;
    padding: 0 10px;
    font-size: 12px;
    cursor: default;
    color: #d3d3d3;
    user-select: none;
  }

  menu-item:hover,
  menu-item.selected {
    background: #696868;
    border: 1px outset #a4a4a4;
    color: white;
  }

  menu-item.disabled {
    font-style: italic;
    color: #bcbcbc;
  }
</style>
