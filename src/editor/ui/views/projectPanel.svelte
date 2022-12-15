<script lang="ts">
  import { ProjectTree } from "./projectPanel.js";
  import Panel from "./components/panel.svelte";
  import TreeView from "./components/treeView.svelte";
  import ButtonBar, { type ButtonBarItem } from "./components/buttonBar.svelte";
  import { Actions } from "../../actions/index.js";
  import Events from "../../events/index.js";
  import { Application } from "../../core/application.js";
  import { FolderNode } from "../../../core/nodes/concrete/meta/folderNode.js";
  import { onMount } from "svelte";
  import { DropZone } from "../components/dropzone";
  import { Menu } from "./components/menu.js";
  import { SceneNode } from "../../../core/nodes/concrete/meta/sceneNode.js";

  const app = Application.instance;
  const dropZone = new DropZone();
  const tree = new ProjectTree();
  const selection = app.selection.project;
  const project = app.project;

  let container: HTMLDivElement;

  $: isDragOver = dropZone.isDragOver.store;

  onMount(() => {
    dropZone.bind(container).on("drop", (files: FileList) => {
      app.importLocalTextures(files);
    });
  });

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
    Events.selection.project.setSingle.bind(() => {
      const node = selection.firstNode;
      const isFolder = selection.isSelected(FolderNode);

      newFolderButton.isEnabled = isFolder;
      newSceneButton.isEnabled = isFolder && node.cast<FolderNode>().isWithinRootFolder("Scenes");

      callback(buttons);
    });
  };

  const onDeleteAssetNode = () => {
    const node = selection.firstNode;

    Actions.deleteNode.dispatch({ nodeId: node.id });
  };

  const treeMenu = new Menu([{ label: "Delete", onClick: onDeleteAssetNode }], (item) => {
    if (item.label === "Delete") {
      item.isHidden = false;
      if (!selection.hasSelection) {
        item.isHidden = true;
      } else {
        const node = selection.firstNode;
        if (
          (node.is(FolderNode) && node.cast<FolderNode>().isRootFolder()) ||
          (node.is(SceneNode) &&
            project.getRootFolder("Scenes").getAllChildrenByType(SceneNode).length === 1)
        ) {
          // hide if root folder or last scene
          item.isHidden = true;
        }
      }
    }
  });
</script>

<project-panel class:isDragOver={$isDragOver}>
  <Panel>
    <div class="container" bind:this={container}>
      <div class="tree">
        <ButtonBar size="small" items={buttons} update={onButtonUpdater} />
        <TreeView {tree} menu={treeMenu} />
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
