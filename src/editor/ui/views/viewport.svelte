<script lang="ts">
  import { onMount } from "svelte";
  import { Application } from "../../core/application";

  const editableView = Application.instance.editorView;

  let container: HTMLDivElement;

  onMount(() => {
    setTimeout(() => {
      editableView.mount(container);
    }, 0);
  });
</script>

<view-port bind:this={container}>
  <!-- custom tags require closing tag-->
</view-port>

<style>
  view-port {
    display: block;
    width: 100%;
    height: 100%;
  }

  /* * :global(canvas) {
    width: 100%;
    height: 100%;
    border: solid 2px red;
  } */
</style>
