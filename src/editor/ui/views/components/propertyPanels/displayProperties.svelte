<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "./panelGroup.svelte";
  import ColorPickerControl from "../propertyControls/colorPropertyControl.svelte";
  import CheckboxControl from "../propertyControls/checkboxPropertyControl.svelte";
  import NumericControl from "../propertyControls/numericPropertyControl.svelte";
  import { PropertyMap } from "./propertyMap";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Display">
  {#if properties.has("tint")}
    <property-row>
      <property-label>tint</property-label>
      <ColorPickerControl property={properties.get("tint")} />
    </property-row>
  {/if}

  {#if properties.has("alpha")}
    <property-row>
      <property-label>alpha</property-label>
      <NumericControl property={properties.get("alpha")} />
    </property-row>
  {/if}

  {#if properties.has("visible")}
    <property-row>
      <property-label>visible</property-label>
      <CheckboxControl property={properties.get("visible")} />
    </property-row>
  {/if}

  {#if properties.has("anchorX", "anchorY")}
    <!-- anchor: x,y -->
    <property-category>Anchor</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("anchorX")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("anchorY")} />
    </property-row>
  {/if}
</PropertyPanel>
