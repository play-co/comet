<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "./panelGroup.svelte";
  import { PropertyMap } from "./propertyMap";
  import SelectControl from "../propertyControls/selectControl.svelte";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Texture">
  {#if properties.has("textureAssetId")}
    <property-row class="single">
      <property-label>id</property-label>
      <SelectControl property={properties.get("textureAssetId")} />
    </property-row>
  {/if}
</PropertyPanel>
