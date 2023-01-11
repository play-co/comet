<script lang="ts" context="module">
  export const spriteMenu = new Menu(
    [
      {
        id: "delete",
        label: "Delete",
        action: Actions.deleteNode,
      },
      {
        id: "copy",
        label: "Copy",
        action: Actions.copy,
      },
      {
        id: "paste",
        label: "Paste",
        action: Actions.paste,
      },
      {
        id: "createPrefab",
        label: "Create Prefab",
        action: Actions.createPrefabAsset,
      },
      {
        id: "resetModel",
        label: "Reset Model",
        action: Actions.resetModel,
      },
      {
        id: "unlink",
        label: "Unlink",
        action: Actions.unlink,
      },
    ],
    (item) => {
      if (!getApp().project.isReady) {
        item.isEnabled = false;
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
