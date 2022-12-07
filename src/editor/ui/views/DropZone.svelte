<script lang="ts">
  import { onMount } from "svelte";

  import { Application } from "../../core/application";
  import { DropZone } from "./dropzone";

  let element: HTMLElement;

  onMount(() => {
    const dropzone = new DropZone(element);

    dropzone.on("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length >= 1) {
        Application.instance.createTexture(files[0]);
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
