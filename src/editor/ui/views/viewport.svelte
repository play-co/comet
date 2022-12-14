<script lang="ts" context="module">
  export const spriteMenu = new Menu(
    [
      {
        id: "delete",
        label: "Delete",
        onClick: () => Actions.deleteNode.dispatch(),
      },
      {
        id: "copy",
        label: "Copy",
        onClick: () => Actions.copy.dispatch(),
      },
      {
        id: "paste",
        label: "Paste",
        onClick: () => Actions.paste.dispatch(),
      },
      {
        id: "createPrefab",
        label: "Create Prefab",
        onClick: () => Actions.newPrefabAsset.dispatch(),
      },
      {
        id: "resetModel",
        label: "Reset Model",
        onClick: () => Actions.resetModel.dispatch(),
      },
      {
        id: "unlink",
        label: "Unlink",
        onClick: () => Actions.unlink.dispatch(),
      },
    ],
    (item) => {
      const app = getApp();
      const selection = app.selection.hierarchy;
      const isOnlySceneSelected = selection.isSingle && selection.firstItem.is(SceneNode);
      const id = item.id;

      if (!app.project.isReady) {
        return;
      }

      if (id === "copy" || id === "delete") {
        item.isEnabled = !isOnlySceneSelected && selection.length > 0;
      } else if (id === "paste") {
        item.isEnabled = app.hasClipboard() && selection.isSingle;
      } else if (id === "createPrefab") {
        item.isEnabled =
          selection.isSingle &&
          !isOnlySceneSelected &&
          selection.firstItem.cloneInfo.cloneMode === CloneMode.Original;
      } else if (id === "resetModel") {
        item.isEnabled = selection.hasSelection;
      }
    }
  );
</script>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Application, getApp } from "../../core/application";
  import { Menu } from "./components/menu";
  import ContextMenu from "./components/contextMenu.svelte";
  import { DropZone } from "../components/dropzone";
  import FocusArea from "./components/focusArea.svelte";
  import { Actions } from "../../actions";
  import { SceneNode } from "../../../core/nodes/concrete/meta/sceneNode";
  import { CloneMode } from "../../../core/nodes/cloneInfo";

  const app = Application.instance;
  const viewport = app.viewport;
  const dropZone = new DropZone("viewport");

  const menu = spriteMenu;

  let container: HTMLDivElement;

  $: isDragOver = dropZone.isDragOver.store;

  onMount(() => {
    viewport.mount(container);
    dropZone
      .bind(container)
      .on("drop", (files: FileList, e: DragEvent) => {
        const viewportLocalPos = viewport.getMouseLocalPoint(e);

        Actions.importTexture.dispatch({ files, createSpriteAtPoint: viewportLocalPos });
      })
      .on("enter", () => {
        app.setFocusArea("viewport");
      });
  });

  onDestroy(() => {
    viewport.unmount(container);
  });
</script>

<FocusArea id="viewport" focus={true}>
  <view-port bind:this={container} class:isDragOver={$isDragOver}>
    <ContextMenu {menu} {container} />
  </view-port>
</FocusArea>

<style>
  view-port {
    display: block;
    width: 100%;
    height: 100%;
    border: 1px solid transparent;
    transition: border 250ms ease-in-out;
  }

  view-port.isDragOver {
    border: 1px solid cyan;
  }
</style>
