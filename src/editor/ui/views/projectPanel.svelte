<script lang="ts">
  import { createModel } from "./projectPanel.js";
  import Panel from "./components/panel.svelte";
  import TreeView from "./components/treeView.svelte";
  import ButtonBar, { type ButtonBarItem } from "./components/buttonBar.svelte";

  const tree = createModel();

  const buttons: ButtonBarItem[] = [
    {
      id: "newScene",
      label: "New Scene",
      icon: "/assets/scene.ico",
      onClick: () => {
        console.log("new scene");
      },
    },
  ];
</script>

<project-panel>
  <Panel>
    <div class="container">
      <div class="tree">
        <ButtonBar size="small" items={buttons} />
        <TreeView {tree} />
      </div>
      <div class="content">content</div>
    </div>
  </Panel>
</project-panel>

<style>
  project-panel {
    width: 100%;
    height: 100%;
  }

  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    grid-gap: 1em;
    height: 100%;
  }

  .tree {
    width: 100%;
    height: 100%;
  }

  .content {
    background-color: green;
  }
</style>
