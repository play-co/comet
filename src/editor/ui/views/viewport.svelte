<script lang="ts">
  import { Application } from "../../core/application";
  import EditorView from "./editorView.svelte";
  import DropZone from "./dropZone.svelte";
</script>

<view-port>
  <DropZone>
    <EditorView view={Application.instance.activeEditorView} />
  </DropZone>
</view-port>

<style>
  view-port {
    width: 100%;
    height: 100%;
    background-color: var(--container-bg-color);
  }
</style>
