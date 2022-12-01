<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "../panelGroup.svelte";
  import PropertyControl from "../propertyControl.svelte";

  export let panel: PropertiesPanel;
</script>

<PropertyPanel title="Transform">
  {#each panel.properties as property (property.key)}
    <PropertyControl label={property.key}>
      <span>control...</span>
    </PropertyControl>
  {/each}
</PropertyPanel>

<style>
</style>
