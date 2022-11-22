<script lang="ts">
  import { onMount } from "svelte";
  import type { EditableView } from "../ui/editableView";

  export let view: EditableView;

  let container: HTMLDivElement;

  onMount(() => {
    view.init(container);
  });
</script>

<div class="fill flex-container-center" bind:this={container} />
