<script lang="ts">
  import { Application } from "../../core/application";
  import DockablePanelLayout from "./dockablePanelLayout.svelte";

  Application.instance.init();
</script>

<main-layout>
  <DockablePanelLayout />
</main-layout>

<style>
  main-layout {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
