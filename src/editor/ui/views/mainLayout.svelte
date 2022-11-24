<script lang="ts">
  import DockablePanelLayout from "./dockablePanelLayout.svelte";
  import Tools from "./tools.svelte";
  import { Application } from "../../core/application";

  Application.instance.init();
</script>

<main-layout>
  <Tools />
  <DockablePanelLayout />
</main-layout>

<style>
  main-layout {
    position: absolute;
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
  }
</style>
