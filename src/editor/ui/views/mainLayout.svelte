<script lang="ts">
  import type { LayoutConfig } from "golden-layout";
  import DockablePanelLayout from "./dockablePanelLayout.svelte";
  import type { FactoryTypes } from "./dockablePanelLayout.svelte";
  import Tools from "./tools.svelte";
  import HierarchyPanel from "./hierarchyPanel.svelte";
  import ProjectPanel from "./projectPanel.svelte";
  import PropertiesPanel from "./propertiesPanel.svelte";
  import Viewport from "./viewport.svelte";

  const factoryTypes: FactoryTypes = {
    Hierarchy: HierarchyPanel,
    Properties: PropertiesPanel,
    Project: ProjectPanel,
    Viewport: Viewport,
  };

  const layoutConfig: LayoutConfig = {
    root: {
      type: "row",
      content: [
        {
          type: "stack",
          content: [
            {
              title: "Hierarchy",
              type: "component",
              componentType: "Hierarchy",
              size: "1fr",
              minWidth: 100,
            },
            {
              title: "Project",
              type: "component",
              componentType: "Project",
              size: "1fr",
              minWidth: 100,
            },
          ],
        },
        {
          type: "column",
          id: "foo",
          size: "2fr",
          content: [
            {
              title: "Viewport",
              type: "component",
              componentType: "Viewport",
              size: "1fr",
              header: {
                show: false,
              },
              // minSize: "100px",
            },
          ],
        },
        {
          id: "properties",
          title: "Properties",
          type: "component",
          componentType: "Properties",
          minWidth: 200,
        },
      ],
    },
    dimensions: {
      headerHeight: 30,
    },
  };
</script>

<main-layout>
  <Tools />
  <DockablePanelLayout {layoutConfig} {factoryTypes} />
</main-layout>

<style>
  main-layout {
    position: absolute;
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
  }
</style>
