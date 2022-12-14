<script lang="ts">
  import { ProjectTree } from "./projectPanel.js";
  import Panel from "./components/panel.svelte";
  import TreeView from "./components/treeView.svelte";
  import ButtonBar, { type ButtonBarItem } from "./components/buttonBar.svelte";
  import { Actions } from "../../actions/index.js";
  import Events from "../../events/index.js";
  import { Application } from "../../core/application.js";
  import type { FolderNode } from "../../../core/nodes/concrete/meta/folderNode.js";
  import { onMount } from "svelte";
  import { DropZone } from "../components/dropzone";

  let container: HTMLElement;
  let dropZone = new DropZone();

  $: isDragOver = dropZone.isDragOver.store;

  onMount(() => {
    dropZone.bind(container).on("drop", (files: FileList) => {
      Application.instance.importLocalTextures(files, false);
    });
  });

  const tree = new ProjectTree();

  const newFolderButton: ButtonBarItem = {
    id: "newFolder",
    label: "New Folder",
    icon: "/assets/folder.ico",
    isEnabled: false,
    onClick: () => {
      Actions.newFolder.dispatch();
    },
  };

  const newSceneButton: ButtonBarItem = {
    id: "newScene",
    label: "New Scene",
    icon: "/assets/scene.ico",
    isEnabled: false,
    onClick: () => {
      Actions.newScene.dispatch();
    },
  };

  const buttons: ButtonBarItem[] = [newFolderButton, newSceneButton];

  const onButtonUpdater = (callback: (items: ButtonBarItem[]) => void) => {
    const { project: selection } = Application.instance.selection;

    Events.selection.project.setSingle.bind(() => {
      const node = selection.items[0];
      const nodeType = node.nodeType();
      const isFolder = nodeType === "Folder";

      newFolderButton.isEnabled = isFolder;
      newSceneButton.isEnabled = isFolder && node.cast<FolderNode>().isRootFolder("Scenes");

      callback(buttons);
    });
  };
</script>

<project-panel class:isDragOver={$isDragOver}>
  <Panel>
    <div class="container" bind:this={container}>
      <div class="tree">
        <ButtonBar size="small" items={buttons} update={onButtonUpdater} />
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
    display: block;
    border: 1px solid transparent;
    transition: border 250ms ease-in-out;
  }

  project-panel.isDragOver {
    border: 1px solid cyan;
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
