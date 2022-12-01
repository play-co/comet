<script lang="ts">
  import type { PropertyBinding } from "../../propertiesPanel";
  import PropertyPanel from "../propertyCategorySubPanel.svelte";

  export let properties: PropertyBinding[];
</script>

<PropertyPanel title="Display">
  {#each properties as property (property.key)}
    <div>{property.key}</div>
  {/each}
</PropertyPanel>

<style>
</style>
