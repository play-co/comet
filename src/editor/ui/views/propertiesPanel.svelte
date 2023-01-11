<script lang="ts">
  import { createController } from "./propertiesPanel.js";
  import Panel from "./components/panel.svelte";
  import FocusArea from "./components/focusArea.svelte";

  const panel = createController();
  const { panels } = panel.store;
</script>

<FocusArea id="properties">
  <properties-panel>
    <Panel>
      {#each $panels as panel (panel.category)}
        <svelte:component this={panel.component} {panel} />
        <!-- <TransformPanel {panel} /> -->
      {/each}
    </Panel>
  </properties-panel>
</FocusArea>

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
    grid-template-columns: 25% 15% 25% 15%;
    grid-gap: 5px;
    width: 100%;
    height: 26px;
    margin-bottom: 5px;
    align-items: center;
  }

  :global(properties-panel property-row.single) {
    grid-template-columns: 20% auto;
  }
</style>
