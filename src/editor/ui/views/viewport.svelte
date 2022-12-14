<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Application } from "../../core/application";
  import { Menu } from "./components/menu";
  import ContextMenu from "./components/contextMenu.svelte";

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

  onMount(() => {
    Application.instance.viewport.mount(container);
  });

  onDestroy(() => {
    Application.instance.viewport.unmount(container);
  });
</script>

<view-port bind:this={container}>
  <ContextMenu {menu} {container} on:select={(e) => console.log("!!!", e)} />
</view-port>

<style>
  view-port {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
