<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Events from "../../../events";
  import type { Menu } from "./menu";
  import PopupMenu from "./popupMenu.svelte";

  export let menu: Menu;
  export let container: HTMLElement;
  export let anchorElement: HTMLElement | undefined = undefined;
  export let anchorPosition: "bottom" | "right" = "bottom";
  export let anchorCenter: boolean = false;

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
    Events.contextMenu.open.bind(onContextMenuShow);
    Events.contextMenu.close.bind(onContextMenuHide);
  });

  onDestroy(() => {
    document.body.removeChild(element);
    Events.contextMenu.open.unbind(onContextMenuShow);
    Events.contextMenu.close.unbind(onContextMenuHide);
  });
</script>

<context-menu bind:this={element}>
  <PopupMenu
    {menu}
    {event}
    target={container}
    {anchorElement}
    {anchorPosition}
    {anchorCenter}
    on:select
    on:close
  />
</context-menu>

<style>
  context-menu {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }
</style>
