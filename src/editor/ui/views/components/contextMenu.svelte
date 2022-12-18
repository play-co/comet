<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Events from "../../../events";
  import type { Menu } from "./menu";
  import PopupMenu from "./popupMenu.svelte";

  export let menu: Menu;
  export let container: HTMLElement;
  export let anchorElement: HTMLElement | undefined = undefined;
  export let anchorPosition: "top" | "bottom" | "left" | "right" = "bottom";

  let element: HTMLElement;

  let event: MouseEvent | undefined;

  const onContextMenuShow = (e: MouseEvent) => {
    event = e;
  };

  const onContextMenuHide = () => {
    event = undefined;
  };

  onMount(() => {
    document.body.appendChild(element);
    Events.editor.contextMenuOpen.bind(onContextMenuShow);
    Events.editor.contextMenuClose.bind(onContextMenuHide);
  });

  onDestroy(() => {
    document.body.removeChild(element);
    Events.editor.contextMenuOpen.unbind(onContextMenuShow);
    Events.editor.contextMenuClose.unbind(onContextMenuHide);
  });
</script>

<context-menu bind:this={element}>
  <PopupMenu {menu} {event} target={container} {anchorElement} on:select on:close />
</context-menu>

<style>
  context-menu {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }
</style>
