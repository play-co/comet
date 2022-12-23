<script lang="ts">
  import { HierarchyTree } from "./hierarchyPanel.js";
  import Panel from "./components/panel.svelte";
  import TreeView from "./components/treeView.svelte";
  import FocusArea from "./components/focusArea.svelte";
  import { spriteMenu } from "./viewport.svelte";

  const tree = new HierarchyTree();

  let treeView: TreeView;

  const onKeyDown = (e: CustomEvent) => {
    const {
      detail: { key },
    } = e;

    key === "ArrowUp" && treeView.selectPrev();
    key === "ArrowDown" && treeView.selectNext();
  };
</script>

<FocusArea id="hierarchy" on:keydown={onKeyDown}>
  <hierarchy-panel>
    <Panel>
      <TreeView bind:this={treeView} {tree} menu={spriteMenu} cssClass="hierarchy" />
    </Panel>
  </hierarchy-panel>
</FocusArea>

<style>
  hierarchy-panel {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    user-select: none;
  }
</style>
