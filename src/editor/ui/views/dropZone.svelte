<script lang="ts">
  import { onMount } from "svelte";

  import Events from "../../events";
  import { DropZone } from "../components/dropzone";

  let element: HTMLElement;

  onMount(() => {
    const dropzone = new DropZone(element);

    dropzone.on("drop", (files: FileList) => {
      Events.file.local.dropped.emit(files);
    });
  });
</script>

<drop-zone bind:this={element}>
  <slot />
</drop-zone>

<style>
  drop-zone {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
