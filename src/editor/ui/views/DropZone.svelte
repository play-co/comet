<script lang="ts" context="module">
  function preventDefaults(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults, false);
  });
</script>

<script lang="ts">
  import { Application } from "../../core/application";

  const onDragEnter = (e: DragEvent) => {
    const { dataTransfer } = e;
    if (dataTransfer) {
      const d = dataTransfer.getData("application/x-moz-file");
      dataTransfer.setData("application/x-moz-file", d);

      dataTransfer.dropEffect = "move";

      console.log("start", d);
    }
  };

  const onDragLeave = (e: DragEvent) => {
    console.log("leave", e);
  };

  const onDrop = (e: DragEvent) => {
    const { dataTransfer } = e;
    if (dataTransfer) {
      var files = dataTransfer.files;
      if (files.length >= 1) {
        console.log("drop", files);
        Application.instance.createTexture(files[0]);
      }
    }
  };
</script>

<drop-zone
  on:dragenter={onDragEnter}
  on:dragleave={onDragLeave}
  on:drop={onDrop}>
  <slot />
</drop-zone>

<style>
  drop-zone {
    width: 100%;
    height: 100%;
  }
</style>
