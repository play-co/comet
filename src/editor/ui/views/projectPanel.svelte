<script lang="ts">
  import { ProjectTree } from "./projectPanel.js";
  import Panel from "./components/panel.svelte";
  import TreeView from "./components/treeView.svelte";
  import ButtonBar, { type ButtonBarItem } from "./components/buttonBar.svelte";
  import ProjectPreview from "./components/projectPreview.svelte";
  import { Actions } from "../../actions/index.js";
  import Events from "../../events/index.js";
  import { Application } from "../../core/application.js";
  import { FolderNode } from "../../../core/nodes/concrete/meta/folderNode.js";
  import { onMount } from "svelte";
  import { DropZone } from "../components/dropzone";
  import { Menu } from "./components/menu.js";
  import { SceneNode } from "../../../core/nodes/concrete/meta/sceneNode.js";
  import FocusArea from "./components/focusArea.svelte";
  import { Icons } from "./icons";
  import type { MetaNode } from "../../../core/nodes/abstract/metaNode.js";

  const app = Application.instance;
  const dropZone = new DropZone("project");
  const tree = new ProjectTree();
  const selection = app.selection.project;
  const project = app.project;
  let orientation: "horizontal" | "vertical" = "vertical";

  let container: HTMLDivElement;
  let treeView: TreeView;

  $: isDragOver = dropZone.isDragOver.store;

  onMount(() => {
    dropZone.bind(container).on("drop", (files: FileList) => {
      Actions.importTexture.dispatch({ files });
    });

    Events.editor.resize.bind(() => {
      const bounds = container.getBoundingClientRect();
      orientation = bounds.width > 400 ? "horizontal" : "vertical";
    });
  });

  const newFolderButton: ButtonBarItem = {
    id: "newFolder",
    label: "New Folder",
    icon: Icons.FolderAdd,
    isEnabled: false,
    onClick: () => {
      Actions.newFolder.dispatch();
    },
  };

  const newSceneButton: ButtonBarItem = {
    id: "newScene",
    label: "New Scene",
    icon: Icons.SceneAdd,
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
      const isScene = selection.isSelected(SceneNode);

      newFolderButton.isEnabled = isFolder;
      newSceneButton.isEnabled =
        (isFolder && node.cast<MetaNode>().isWithinRootFolder("Scenes")) || isScene;

      callback(buttons);
    });
  };

  const onDeleteAssetNode = () => {
    const node = selection.firstNode;
    if (app.project.getRootFolder("Textures").contains(node)) {
      Actions.deleteTexture.dispatch({ nodeId: node.id });
    } else if (app.project.getRootFolder("Prefabs").contains(node)) {
      Actions.deletePrefab.dispatch({ nodeId: node.id });
    }
  };

  const onCreateVariant = () => {
    Actions.newPrefabVariant.dispatch({ nodeId: selection.firstNode.id });
  };

  const treeMenu = new Menu(
    [
      {
        id: "delete",
        label: "Delete",
        onClick: onDeleteAssetNode,
      },
      {
        id: "createVariant",
        label: "Create Variant",
        onClick: onCreateVariant,
      },
    ],
    (item) => {
      if (!app.project.isReady) {
        return;
      }

      if (item.id === "delete") {
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
      } else if (item.id === "createVariant") {
        const node = selection.firstNode;
        item.isHidden = true;
        if (app.project.getRootFolder("Prefabs").contains(node) && !node.is(FolderNode)) {
          item.isHidden = false;
        }
      }
    }
  );

  const onKeyDown = (e: CustomEvent) => {
    const {
      detail: { key },
    } = e;

    key === "ArrowUp" && treeView.selectPrev();
    key === "ArrowDown" && treeView.selectNext();
  };
</script>

<FocusArea id="project" on:keydown={onKeyDown}>
  <project-panel class:isDragOver={$isDragOver}>
    <Panel>
      <div class="container" class:horizontal={orientation === "horizontal"} bind:this={container}>
        <div class="tree">
          <ButtonBar size="small" items={buttons} update={onButtonUpdater} />
          <TreeView bind:this={treeView} {tree} menu={treeMenu} />
        </div>
        <div class="preview">
          <ProjectPreview />
        </div>
      </div>
    </Panel>
  </project-panel>
</FocusArea>

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
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .container.horizontal {
    flex-direction: row;
  }

  .tree {
    flex-grow: 1;
  }

  .container.horizontal .tree {
    height: calc(100% - 20px);
    flex-grow: 0;
    width: 40%;
  }

  .preview {
    flex-grow: 1;
    margin-top: 30px;
  }

  .container.horizontal .preview {
    margin-top: 0;
    margin-left: 5px;
    flex-grow: 2;
  }
</style>
