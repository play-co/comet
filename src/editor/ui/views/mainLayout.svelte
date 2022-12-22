<script lang="ts">
  import DockablePanelLayout from "./dockablePanelLayout.svelte";
  import Tools from "./tools.svelte";
  import { factoryTypes, layoutConfig } from "./mainLayout";
  import StatusBar from "./statusBar.svelte";
  import MenuBar from "./menuBar.svelte";
  import { fade, scale } from "svelte/transition";

  import ItemDrag from "./components/itemDrag.svelte";
  import Preload from "./components/preload.svelte";
</script>

<main-layout transition:fade={{ duration: 1000 }}>
  <MenuBar />
  <img
    transition:scale={{ duration: 5000 }}
    id="logo"
    src="assets/logo_small.png"
    alt="Welcome to Comet!"
  />
  <div class="horizontal">
    <Tools />
    <DockablePanelLayout {layoutConfig} {factoryTypes} />
  </div>
  <StatusBar />
  <ItemDrag />

  <Preload />
</main-layout>

<style>
  main-layout {
    background-color: var(--panel-bg-color-dark);
    position: absolute;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .horizontal {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    padding: 5px;
  }

  #logo {
    position: absolute;
    top: 4px;
    left: 0px;
    z-index: 100;
    width: 50px;
  }
</style>
