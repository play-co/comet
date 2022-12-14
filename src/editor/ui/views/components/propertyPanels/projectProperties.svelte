<script lang="ts">
  import type { PropertiesPanel } from "../../propertiesPanel";
  import PropertyPanel from "./panelGroup.svelte";

  export let panel: PropertiesPanel;
</script>

<PropertyPanel title="Project">
  <p>todo...{String(panel) ? "" : ""}</p>
</PropertyPanel>

<style>
  p {
    color: #666;
    font-style: italic;
  }
</style>
