<script lang="ts">
  import PropertyPanel from "./panelGroup.svelte";
</script>

<PropertyPanel title="Project">
  <property-row>
    <property-label>name</property-label>
    <input type="text" class="name" />
  </property-row>
</PropertyPanel>

<style>
  .name {
    grid-column-end: 5;
    grid-column-start: 2;
    display: grid;
  }
</style>
