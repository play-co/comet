<script lang="ts">
  import PropertyPanel from "./panelGroup.svelte";
  import CheckboxControl from "../propertyControls/checkboxControl.svelte";
  import { saveUserEditPrefs } from "../../../../core/userPrefs";
  import { getApp } from "../../../../core/application";

  const app = getApp();

  const onVisibleChange = (e: CustomEvent) => {
    getApp().showGrid(e.detail);
    saveUserEditPrefs();
  };
</script>

<PropertyPanel title="Grid">
  <property-row>
    <property-label>visible</property-label>
    <CheckboxControl checked={app.gridSettings.visible} on:change={onVisibleChange} />
  </property-row>
</PropertyPanel>

<style>
  p {
    color: #666;
    font-style: italic;
  }
</style>
