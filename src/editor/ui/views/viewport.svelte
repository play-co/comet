<script lang="ts">
  import { onMount } from "svelte";
  import { Application } from "../../core/application";
  import Events from "../../events";
  import { Menu } from "./components/menu";
  import PopupMenu from "./components/popupMenu.svelte";

  let container: HTMLDivElement;

  onMount(() => Application.instance.viewport.mount(container));

  const menu = new Menu([
    { label: "Item 1" },
    { label: "Item 2" },
    { label: "Item 3" },
  ]);

  let event: MouseEvent | undefined;

  Events.editor.contextMenu.bind((e) => {
    event = e;
  });
</script>

<view-port bind:this={container}>
  <PopupMenu {menu} {event} target={container} />
</view-port>

<style>
  view-port {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
