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

  $: {
    if (event) {
      x = event.clientX;
      y = event.clientY;
    }
  }

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
  <popup-menu
    bind:this={container}
    class:submenu={isSubMenu}
    style={`left:${isSubMenu ? "100%" : `${x}px`};top:${isSubMenu ? 0 : y}px;`}>
    {#each menu.items as item}
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <menu-item
        class:selected={item === active}
        on:mouseover={() => (active = item)}>
        {item.label}
        {#if item.menu && active === item}
          <svelte:self
            {event}
            menu={item.menu}
            target={container}
            isSubMenu={true} />
        {/if}
      </menu-item>
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
  }

  menu-item:hover,
  menu-item.selected {
    background: #8f8f8f;
    border: 1px solid #828282;
  }
</style>
