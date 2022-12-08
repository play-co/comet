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
    <property-category>Position</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("x")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("y")} />
    </property-row>
  {/if}

  {#if properties.has("scaleX", "scaleY")}
    <property-category>Position</property-category>
    <property-row>
      <property-label>w</property-label>
      <NumericControl property={properties.get("scaleX")} mode="width" />
      <property-label>h</property-label>
      <NumericControl property={properties.get("scaleY")} mode="height" />
    </property-row>

    <property-category>Scale</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("scaleX")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("scaleY")} />
    </property-row>
  {/if}

  {#if properties.has("angle")}
    <property-category>Rotation</property-category>
    <property-row>
      <property-label>θ</property-label>
      <NumericControl property={properties.get("angle")} />
    </property-row>
  {/if}

  {#if properties.has("pivotX", "pivotY")}
    <property-category>Pivot</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("pivotX")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("pivotY")} />
    </property-row>
  {/if}

  {#if properties.has("skewX", "skewY")}
    <property-category>Skew</property-category>
    <property-row>
      <property-label>x</property-label>
      <NumericControl property={properties.get("skewX")} />
      <property-label>y</property-label>
      <NumericControl property={properties.get("skewY")} />
    </property-row>
  {/if}
</PropertyPanel>
