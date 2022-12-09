<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Application } from "../../core/application";
  import Events from "../../events";
  import { Menu } from "./components/menu";
  import PopupMenu from "./components/popupMenu.svelte";

  let container: HTMLDivElement;

  const subMenuA = new Menu([{ label: "Item 4" }, { label: "Item 5" }, { label: "Item 6" }]);

  const subMenuB = new Menu([
    { label: "Item 7" },
    { label: "Item 8" },
    { label: "Item 9", menu: subMenuA },
  ]);

  const menu = new Menu([
    { label: "Item 1" },
    { label: "Item 2", menu: subMenuB },
    { label: "Item 3" },
  ]);

  let event: MouseEvent | undefined;

  const onContextMenuShow = (e: MouseEvent) => {
    event = e;
  };

  const onContextMenuHide = () => {
    event = undefined;
  };

  onMount(() => {
    Application.instance.viewport.mount(container);
    Events.editor.contextMenuOpen.bind(onContextMenuShow);
    Events.editor.contextMenuClose.bind(onContextMenuHide);
  });

  onDestroy(() => {
    Application.instance.viewport.unmount(container);
    Events.editor.contextMenuOpen.unbind(onContextMenuShow);
    Events.editor.contextMenuClose.unbind(onContextMenuHide);
  });
</script>

<view-port bind:this={container}>
  <PopupMenu {menu} {event} target={container} on:select={(e) => console.log("!!!", e.detail)} />
</view-port>

<style>
  view-port {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
