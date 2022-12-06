<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "./panelGroup.svelte";
  import PropertyControl from "./propertyControl.svelte";
  import ColorPickerControl from "../controls/colorPropertyControl.svelte";
  import CheckboxControl from "../controls/checkboxPropertyControl.svelte";
  import { PropertyMap } from "./propertyMap";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Display">
  {#each panel.properties as property (property.key)}
    <PropertyControl label={property.key}>
      <span>control todo...</span>
    </PropertyControl>
  {/each}
  {#if properties.has("tint")}
    <PropertyControl label={"Tint"}>
      <ColorPickerControl property={properties.get("tint")} />
    </PropertyControl>
  {/if}
  {#if properties.has("visible")}
    <PropertyControl label={"Visible"}>
      <CheckboxControl property={properties.get("visible")} />
    </PropertyControl>
  {/if}
</PropertyPanel>

<style>
  span {
    font-size: 11px;
    font-style: italic;
  }
</style>
