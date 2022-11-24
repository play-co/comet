<script lang="ts">
  import { onMount } from "svelte";
  import { createLayout } from "./dockablePanelLayout";

  let container: HTMLElement;

  onMount(() => {
    const layout = createLayout(container);
    console.log(layout);
  });
</script>

<panel-layout bind:this={container}>
  <!-- custom tags need a closing tag -->
</panel-layout>

<style>
  panel-layout {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
