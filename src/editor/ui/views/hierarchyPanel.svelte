<script lang="ts">
  import { HierarchyTree } from "./hierarchyPanel.js";
  import Panel from "./components/panel.svelte";
  import TreeView from "./components/treeView.svelte";
  import ButtonBar, { type ButtonBarItem } from "./components/buttonBar.svelte";
  import { Actions } from "../../actions/index.js";
  import FocusArea from "./components/focusArea.svelte";
  import { Icons } from "./icons";

  const tree = new HierarchyTree();

  const buttons: ButtonBarItem[] = [
    {
      id: "createSprite",
      label: "Create Sprite",
      icon: Icons.Sprite,
      onClick: () => {
        Actions.newSprite.dispatch({ addToSelected: true });
      },
    },
    {
      id: "createContainer",
      label: "Create Container",
      icon: Icons.Container,
      onClick: () => {
        Actions.newContainer.dispatch({ addToSelected: true });
      },
    },
  ];

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
      <ButtonBar size="small" items={buttons} />
      <TreeView bind:this={treeView} {tree} />
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
