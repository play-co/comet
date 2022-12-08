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

  :global(properties-panel property-category) {
    font-size: 10px;
    margin-left: 5px;
    text-transform: uppercase;
    color: #a2a2a2;
  }

  :global(properties-panel property-label) {
    text-align: right;
    font-size: 13px;
    border-radius: 3px;
  }

  :global(properties-panel property-label:after) {
    content: ":";
  }

  :global(properties-panel property-row) {
    display: grid;
    grid-template-columns: repeat(4, 19%);
    grid-gap: 10px;
    width: 100%;
    height: 100%;
    margin-bottom: 5px;
  }
</style>
