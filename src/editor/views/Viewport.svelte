<script lang="ts">
  import { Application } from "../application";
  import EditorView from "./EditorView.svelte";
  import DropZone from "./DropZone.svelte";
</script>

<div data-id="viewport" class="fill">
  <DropZone>
    <EditorView view={Application.instance.activeEditorView} />
  </DropZone>
</div>

<style>
  [data-id="viewport"] {
    background-color: var(--container-bg-color);
  }
</style>
