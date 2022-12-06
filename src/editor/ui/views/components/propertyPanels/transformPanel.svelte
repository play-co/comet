<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import { PropertyMap } from "./propertyMap";
  import PropertyPanel from "./panelGroup.svelte";
  import PropertyPairControl from "./propertyPairControl.svelte";
  import PropertyControl from "./propertyControl.svelte";
  import NumericControl from "../controls/numericPropertyControl.svelte";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Transform">
  {#if properties.has("x", "y")}
    <!-- position: x,y -->
    <PropertyPairControl label="Position">
      <PropertyControl label="x" slot="prop1">
        <NumericControl property={properties.get("x")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <NumericControl property={properties.get("y")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}

  {#if properties.has("scaleX", "scaleY")}
    <!-- size: w,h -->
    <PropertyPairControl label="Size">
      <PropertyControl label="w" slot="prop1">
        <NumericControl property={properties.get("scaleX")} mode={"width"} />
      </PropertyControl>
      <PropertyControl label="h" slot="prop2">
        <NumericControl property={properties.get("scaleY")} mode={"height"} />
      </PropertyControl>
    </PropertyPairControl>

    <!-- scale: x,y -->
    <PropertyPairControl label="Scale">
      <PropertyControl label="x" slot="prop1">
        <NumericControl property={properties.get("scaleX")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <NumericControl property={properties.get("scaleY")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}

  {#if properties.has("angle")}
    <!-- angle -->
    <div class="single">
      <PropertyControl label="angle">
        <NumericControl property={properties.get("angle")} />
      </PropertyControl>
      <div class="spacer" />
    </div>
  {/if}

  {#if properties.has("pivotX", "pivotY")}
    <!-- pivot: x,y -->
    <PropertyPairControl label="Pivot">
      <PropertyControl label="x" slot="prop1">
        <NumericControl property={properties.get("pivotX")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <NumericControl property={properties.get("pivotY")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}

  {#if properties.has("skewX", "skewY")}
    <!-- skew: x,y -->
    <PropertyPairControl label="Skew">
      <PropertyControl label="x" slot="prop1">
        <NumericControl property={properties.get("skewX")} />
      </PropertyControl>
      <PropertyControl label="y" slot="prop2">
        <NumericControl property={properties.get("skewY")} />
      </PropertyControl>
    </PropertyPairControl>
  {/if}
</PropertyPanel>

<style>
  .single {
    display: flex;
  }

  .spacer {
    width: 100px;
  }
</style>
