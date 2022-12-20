<script lang="ts" context="module">
  export const cloneMenu = new Menu([
    {
      label: "Copy",
      onClick: () => Actions.copy.dispatch(),
    },
    {
      label: "Paste",
      onClick: () => Actions.paste.dispatch(),
    },
    {
      label: "Create Prefab",
      onClick: () => Application.instance.createPrefabFromSelection(),
    },
  ]);
</script>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Application } from "../../core/application";
  import { Menu } from "./components/menu";
  import ContextMenu from "./components/contextMenu.svelte";
  import { DropZone } from "../components/dropzone";
  import FocusArea from "./components/focusArea.svelte";
  import { Actions } from "../../actions";

  const app = Application.instance;
  const viewport = app.viewport;
  const dropZone = new DropZone("viewport");
  // const subMenuA = new Menu([{ label: "Item Sub 4" }, { label: "Item 5" }, { label: "Item 6" }]);
  // const subMenuB = new Menu([
  //   { label: "Item Longer 7" },
  //   { label: "Item 8" },
  //   { label: "Item 9", menu: subMenuA },
  // ]);
  // const menu = new Menu([
  //   { data: 1, label: "Item 1" },
  //   { label: "Item 2", menu: subMenuB },
  //   { label: "Item 3" },
  // ]);

  const menu = cloneMenu;

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
