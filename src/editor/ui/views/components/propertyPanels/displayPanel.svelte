<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "./panelGroup.svelte";
  import PropertyControl from "./propertyControl.svelte";
  import PropertyPairControl from "./propertyPairControl.svelte";
  import ColorPickerControl from "../controls/colorPropertyControl.svelte";
  import CheckboxControl from "../controls/checkboxPropertyControl.svelte";
  import NumericControl from "../controls/numericPropertyControl.svelte";
  import { PropertyMap } from "./propertyMap";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Display">
  {#if properties.has("alpha")}
    <PropertyControl label={"alpha"}>
      <NumericControl property={properties.get("alpha")} />
    </PropertyControl>
  {/if}

  {#if properties.has("tint")}
    <PropertyControl label={"tint"}>
      <ColorPickerControl property={properties.get("tint")} />
    </PropertyControl>
  {/if}

  {#if properties.has("visible")}
    <PropertyControl label={"visible"}>
      <CheckboxControl property={properties.get("visible")} />
    </PropertyControl>
  {/if}

  {#if properties.has("anchorX", "anchorY")}
    <!-- anchor: x,y -->
    <PropertyPairControl label="Anchor">
      <PropertyControl label="x" slot="prop1">
        <NumericControl property={properties.get("anchorX")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <NumericControl property={properties.get("anchorY")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}
</PropertyPanel>
