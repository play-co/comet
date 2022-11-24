<script lang="ts">
  import type { LayoutConfig } from "golden-layout";
  import PropertiesPanel from "./propertiesPanel.svelte";
  import DockablePanelLayout from "./dockablePanelLayout.svelte";
  import type { FactoryTypes } from "./dockablePanelLayout.svelte";

  const factoryTypes: FactoryTypes = {
    Properties: PropertiesPanel,
  };

  const layoutConfig: LayoutConfig = {
    root: {
      type: "row",
      content: [
        {
          type: "stack",
          content: [
            {
              title: "Properties",
              type: "component",
              componentType: "Properties",
              minSize: "250px",
            },
            {
              title: "Properties",
              type: "component",
              componentType: "Properties",
              minSize: "250px",
            },
          ],
        },
      ],
    },
    dimensions: {
      headerHeight: 30,
    },
  };
</script>

<view-port>
  <DockablePanelLayout {layoutConfig} {factoryTypes} />
</view-port>

<style>
  view-port {
    width: 100%;
    height: 100%;
  }
</style>
