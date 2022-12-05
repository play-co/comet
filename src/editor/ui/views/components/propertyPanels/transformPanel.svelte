<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import { PropertyMap } from "./propertyMap";
  import PropertyPanel from "./panelGroup.svelte";
  import PropertyPairControl from "./propertyPairControl.svelte";
  import PropertyControl from "./propertyControl.svelte";
  import SimpleNumericInput from "../controls/numericControl.svelte";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Transform">
  {#if properties.has("x", "y")}
    <!-- position: x,y -->
    <PropertyPairControl label="Position">
      <PropertyControl label="x" slot="prop1">
        <SimpleNumericInput property={properties.get("x")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <SimpleNumericInput property={properties.get("y")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}
  {#if properties.has("pivotX", "pivotY")}
    <!-- pivot: x,y -->
    <PropertyPairControl label="Pivot">
      <PropertyControl label="x" slot="prop1">
        <SimpleNumericInput property={properties.get("pivotX")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <SimpleNumericInput property={properties.get("pivotY")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}
  {#if properties.has("angle")}
    <!-- angle -->
    <PropertyControl label="θ">
      <SimpleNumericInput property={properties.get("angle")} />
    </PropertyControl>
  {/if}
  {#if properties.has("scaleX", "scaleY")}
    <!-- scale: x,y -->
    <PropertyPairControl label="Scale">
      <PropertyControl label="x" slot="prop1">
        <SimpleNumericInput property={properties.get("scaleX")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <SimpleNumericInput property={properties.get("scaleY")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}
  {#if properties.has("skewX", "skewY")}
    <!-- skew: x,y -->
    <PropertyPairControl label="Skew">
      <PropertyControl label="x" slot="prop1">
        <SimpleNumericInput property={properties.get("skewX")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <SimpleNumericInput property={properties.get("skewY")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}
  {#if properties.has("anchorX", "anchorY")}
    <!-- anchor: x,y -->
    <PropertyPairControl label="Anchor">
      <PropertyControl label="x" slot="prop1">
        <SimpleNumericInput property={properties.get("anchorX")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <SimpleNumericInput property={properties.get("anchorY")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}
</PropertyPanel>
