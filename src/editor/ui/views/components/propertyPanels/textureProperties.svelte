<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "./panelGroup.svelte";
  import { PropertyMap } from "./propertyMap";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Texture">
  {#if properties.has("textureAssetId")}
    <property-row>
      <property-label>texture</property-label>
      Ctrl
    </property-row>
  {/if}
</PropertyPanel>
