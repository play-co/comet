<script lang="ts">
  import { Application } from "../application";
  import EditorView from "./EditorView.svelte";
  import DropZone from "./DropZone.svelte";
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
