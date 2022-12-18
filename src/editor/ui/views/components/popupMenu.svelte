<script lang="ts">
  import { onDestroy, onMount, afterUpdate, createEventDispatcher } from "svelte";
  import Events from "../../../events";
  import type { Menu, MenuItem } from "./menu";
  import { slide } from "svelte/transition";

  export let menu: Menu;
  export let event: MouseEvent | undefined;
  export let target: HTMLElement;
  export let isSubMenu = false;
  export let anchorElement: HTMLElement | undefined = undefined;
  export let anchorPosition: "bottom" | "right" = "bottom";

  const dispatch = createEventDispatcher();

  let show = false;
  let container: HTMLElement;
  let lastBounds: DOMRect | undefined;

  $: x = 0;
  $: y = 0;
  $: active = undefined as MenuItem | undefined;

  $: {
    if (event) {
      if (anchorElement) {
        const bounds = anchorElement.getBoundingClientRect();
        if (anchorPosition === "bottom") {
          x = bounds.left;
          y = bounds.bottom;
        } else if (anchorPosition === "right") {
          x = bounds.right;
          y = bounds.top;
        }
      } else {
        x = event.clientX;
        y = event.clientY;
      }
    }
  }

  $: subMenuLeft = "calc(100% + 2px)";
  $: subMenuTop = "0";
  $: left = isSubMenu ? subMenuLeft : `${x}px`;
  $: top = isSubMenu ? subMenuTop : `${y}px`;
  $: style = `left:${left};top:${top}`;

  $: {
    if (event && target) {
      if (target.contains(event.target as HTMLElement)) {
        show = true;
      } else {
        show = false;
      }
    }
  }

  $: items = menu.getItems();
  $: hasIcons = items.some((item) => item.icon !== undefined);

  function close() {
    Events.contextMenu.close.emit();
    dispatch("close");
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
      Events.contextMenu.close.emit();
    }
  };

  onMount(() => {
    if (!isSubMenu) {
      window.addEventListener("mousedown", onMouseDown);
      Events.key.down.bind(onKeyDown);
    }
    Events.contextMenu.close.bind(onContextMenuClose);
  });

  onDestroy(() => {
    if (!isSubMenu) {
      window.removeEventListener("mousedown", onMouseDown);
      Events.key.down.unbind(onKeyDown);
    }
    Events.contextMenu.close.unbind(onContextMenuClose);
  });

  afterUpdate(() => {
    const maxX = document.body.clientWidth;
    const maxY = document.body.clientHeight;
    const marginX = 10;
    const marginY = 10;

    if (container) {
      const bounds = container.getBoundingClientRect();

      const a = bounds.toJSON();
      const b = lastBounds?.toJSON() || {};
      const isEqual =
        a.left === b.left && a.top === b.top && a.right === b.right && a.bottom === b.bottom;

      if (!isEqual) {
        let transformX = "";
        let transformY = "";

        if (bounds.right > maxX) {
          const overflowX = bounds.right - maxX;
          transformX += `translateX(-${overflowX + marginX}px)`;
        }

        if (bounds.bottom > maxY) {
          const overflowY = bounds.bottom - maxY;
          transformY += `translateY(-${overflowY + marginY}px)`;
        }

        let transform = `${transformX} ${transformY}`;
        container.style.transform = transform;
      }

      lastBounds = bounds;
    }
  });
</script>

{#if (event && show) || isSubMenu}
  <!-- svelte-ignore a11y-mouse-events-have-key-events -->
  <popup-menu
    bind:this={container}
    transition:slide={{ duration: 50 }}
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
        class:hasIcons
        class:prompt={item.style === "prompt"}
        class:separator={item.style === "separator"}
        on:mouseover={() => (active = item)}
        on:click={() => onMenuItemClick(item)}
      >
        {#if item.icon}
          <!-- svelte-ignore a11y-missing-attribute -->
          <img src={item.icon} class="icon" />
        {/if}
        {#if !item.icon && hasIcons}
          <div class="iconMargin" />
        {/if}
        <span class="label">{item.label}</span>
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
    z-index: 100000;
    box-shadow: 5px 5px 5px #00000045;
  }

  popup-menu.submenu {
    position: absolute;
    top: 0px;
    left: 100%;
  }

  menu-item {
    display: flex;
    align-items: center;
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
    color: #8a8a8a;
  }

  menu-item.prompt {
    font-style: italic;
  }

  .label {
    display: inline-block;
    vertical-align: middle;
  }

  .iconMargin {
    height: 16px;
    width: 21px;
    display: inline-block;
  }

  .icon {
    width: 16px;
    margin-right: 5px;
    pointer-events: none;
  }
</style>
