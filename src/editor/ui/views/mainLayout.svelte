<script lang="ts">
  import { Application } from "../../core/application";
  import PropertiesPanel from "./propertiesPanel.svelte";

  Application.instance.init();
</script>

<main-layout>
  <PropertiesPanel />
</main-layout>

<style>
  main-layout {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
