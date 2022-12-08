<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import { PropertyMap } from "./propertyMap";
  import PropertyPanel from "./panelGroup.svelte";
  import NumericControl from "../controls/numericPropertyControl.svelte";

  export let panel: PropertiesPanel;

  let properties: PropertyMap;

  $: properties = new PropertyMap(panel.properties);
</script>

<PropertyPanel title="Transform">
  {#if properties.has("x", "y")}
    <!-- position: x,y -->
    <property-category>Position</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("x")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("y")} />
    </property-row>
  {/if}

  {#if properties.has("scaleX", "scaleY")}
    <!-- size: w,h -->
    <property-category>Position</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("x")} mode="width" />
      <property-label>y</property-label>
      <NumericControl property={properties.get("y")} mode="height" />
    </property-row>

    <!-- scale: x,y -->
    <property-category>Scale</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("scaleX")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("scaleY")} />
    </property-row>
  {/if}

  {#if properties.has("angle")}
    <!-- angle -->
    <property-category>Rotation</property-category>
    <property-row>
      <property-label>θ</property-label>
      <NumericControl property={properties.get("angle")} />
    </property-row>
  {/if}

  {#if properties.has("pivotX", "pivotY")}
    <!-- pivot: x,y -->
    <property-category>Pivot</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("pivotX")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("pivotY")} />
    </property-row>
  {/if}

  {#if properties.has("skewX", "skewY")}
    <!-- skew: x,y -->
    <property-category>Skew</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("skewX")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("skewY")} />
    </property-row>
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
