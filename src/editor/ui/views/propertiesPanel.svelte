<script lang="ts">
  import Panel from "./components/panel.svelte";
  let foo = 1;
</script>

<properties-panel>
  <h1 on:mouseover={() => foo++}>Props {foo}</h1>
  <Panel />
</properties-panel>

<style>
  properties-panel {
    display: flex;
    flex-grow: 0;
    width: 30%;
    height: 100%;
  }
</style>
