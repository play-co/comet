<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "./panelGroup.svelte";
  import PropertyControl from "./propertyControl.svelte";
  import SimpleNumericInput from "../controls/simpleNumericInput.svelte";

  export let panel: PropertiesPanel;
</script>

<PropertyPanel title={`Transform-${panel.id}`}>
  {#each panel.properties as property (property.key)}
    <PropertyControl label={property.key} id={panel.id}>
      <SimpleNumericInput {property} id={panel.id} />
    </PropertyControl>
  {/each}
</PropertyPanel>

<style>
</style>
