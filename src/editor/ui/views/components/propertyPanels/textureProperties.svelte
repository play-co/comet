<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "./panelGroup.svelte";
  import NumericControl from "../propertyControls/numericPropertyControl.svelte";
  import { PropertyMap } from "./propertyMap";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Display">
  {#if properties.has("alpha")}
    <property-row>
      <property-label>alpha</property-label>
      <NumericControl property={properties.get("alpha")} />
    </property-row>
  {/if}
</PropertyPanel>
