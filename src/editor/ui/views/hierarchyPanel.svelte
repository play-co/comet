<script lang="ts">
  import { HierarchyTree } from "./hierarchyPanel.js";
  import Panel from "./components/panel.svelte";
  import TreeView from "./components/treeView.svelte";
  import ButtonBar, { type ButtonBarItem } from "./components/buttonBar.svelte";
  import { Actions } from "../../actions/index.js";

  const tree = new HierarchyTree();

  const buttons: ButtonBarItem[] = [
    {
      id: "createSprite",
      label: "Create Sprite",
      icon: "/assets/sprite.ico",
      onClick: () => {
        Actions.newSprite.dispatch({ addToSelected: true });
      },
    },
    {
      id: "createContainer",
      label: "Create Container",
      icon: "/assets/container.ico",
      onClick: () => {
        Actions.newContainer.dispatch({ addToSelected: true });
      },
    },
  ];
</script>

<hierarchy-panel>
  <Panel>
    <ButtonBar size="small" items={buttons} />
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
