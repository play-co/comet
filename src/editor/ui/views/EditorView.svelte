<script lang="ts">
  import { onMount } from "svelte";
  import type { EditableView } from "../../ui/components/editableView";

  export let view: EditableView;

  let container: HTMLDivElement;

  onMount(() => {
    view.init(container);
  });
</script>

<div bind:this={container} />

<style>
  div {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
