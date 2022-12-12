<script lang="ts">
  import Panel from "./components/panel.svelte";
</script>

<project-panel>
  <Panel>
    <div class="container">
      <div class="tree">tree</div>
      <div class="content">content</div>
    </div>
  </Panel>
</project-panel>

<style>
  project-panel {
    width: 100%;
    height: 100%;
  }

  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    grid-gap: 1em;
    height: 100%;
  }

  .tree {
    background-color: red;
  }

  .content {
    background-color: green;
  }
</style>
