<script lang="ts">
  import { onMount } from "svelte";
  import { Application } from "../../core/application";

  let container: HTMLDivElement;

  onMount(() => {
    Application.instance.viewport.mount(container);
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
</style>
