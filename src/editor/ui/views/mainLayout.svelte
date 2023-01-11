<script lang="ts">
  import DockablePanelLayout from "./dockablePanelLayout.svelte";
  import Tools from "./tools.svelte";
  import { factoryTypes, layoutConfig } from "./mainLayout";
  import StatusBar from "./statusBar.svelte";
  import MenuBar from "./menuBar.svelte";
  import { fade, scale } from "svelte/transition";

  import ItemDrag from "./components/itemDrag.svelte";
  import Events from "../../events";

  let blur = true;

  function unblur() {
    blur = false;
  }

  Events.dialog.modal.open.bind(() => (blur = true));
  Events.dialog.modal.close.bind(unblur);
  Events.project.ready.bind(unblur);
</script>

<main-layout transition:fade={{ duration: 1000 }} class:blur>
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
</main-layout>

<style>
  main-layout {
    background-color: var(--panel-bg-color-dark);
    position: absolute;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    transition: filter 1s ease-out;
  }

  .horizontal {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    padding: 5px;
  }

  #logo {
    position: absolute;
    top: 17px;
    left: -8px;
    z-index: 10;
    width: 65px;
    transform: rotateZ(337deg);
  }
</style>
