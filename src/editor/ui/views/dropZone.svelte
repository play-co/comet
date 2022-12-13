<script lang="ts">
  import { onMount } from "svelte";

  import Events from "../../events";
  import { DropZone } from "../components/dropzone";

  let element: HTMLElement;

  onMount(() => {
    const dropzone = new DropZone(element);

    dropzone.on("drop", (e) => {
      const files = e.dataTransfer.files;

      if (files.length > 0) {
        Events.file.local.dropped.emit(files);
      }
    });
  });
</script>

<drop-zone bind:this={element}>
  <slot />
</drop-zone>

<style>
  drop-zone {
    width: 100%;
    height: 100%;
  }
</style>
