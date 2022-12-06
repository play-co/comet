<script lang="ts">
  import { createController } from "./propertiesPanel.js";
  import Panel from "./components/panel.svelte";

  const panel = createController();
  const { panels } = panel.store;
</script>

<properties-panel>
  <Panel>
    {#each $panels as panel (panel.category)}
      <svelte:component this={panel.component} {panel} />
      <!-- <TransformPanel {panel} /> -->
    {/each}
  </Panel>
</properties-panel>

<style>
  properties-panel {
    width: 100%;
    height: 100%;
    user-select: none;
  }
</style>
