<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { Application } from "../../core/application";
  import { Menu } from "./components/menu";
  import ContextMenu from "./components/contextMenu.svelte";
  import { DropZone } from "../components/dropzone";

  const app = Application.instance;
  const viewport = app.viewport;
  const dropZone = new DropZone();
  const subMenuA = new Menu([{ label: "Item Sub 4" }, { label: "Item 5" }, { label: "Item 6" }]);
  const subMenuB = new Menu([
    { label: "Item Longer 7" },
    { label: "Item 8" },
    { label: "Item 9", menu: subMenuA },
  ]);
  const menu = new Menu([
    { data: 1, label: "Item 1" },
    { label: "Item 2", menu: subMenuB },
    { label: "Item 3" },
  ]);

  let container: HTMLDivElement;

  $: isDragOver = dropZone.isDragOver.store;

  onMount(() => {
    viewport.mount(container);
    dropZone.bind(container).on("drop", (files: FileList, e: DragEvent) => {
      const clientPos = { x: e.clientX, y: e.clientY };
      const viewportMousePos = viewport.getMousePos(clientPos.x, clientPos.y);
      const viewportLocalPos = viewport.getLocalPoint(viewportMousePos.x, viewportMousePos.y);

      app.importLocalTextures(files, viewportLocalPos);
    });
  });

  onDestroy(() => {
    viewport.unmount(container);
  });
</script>

<view-port bind:this={container} class:isDragOver={$isDragOver}>
  <ContextMenu {menu} {container} />
</view-port>

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
