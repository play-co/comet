<script lang="ts">
  import { createModel } from "./hierarchyPanel.js";
  import Panel from "./components/panel.svelte";
  import TreeView from "./components/treeView.svelte";

  const tree = createModel();
</script>

<hierarchy-panel>
  <Panel>
    <TreeView {tree} />
  </Panel>
</hierarchy-panel>

<style>
  hierarchy-panel {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    user-select: none;
  }
</style>
