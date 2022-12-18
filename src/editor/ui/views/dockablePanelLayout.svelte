<script lang="ts" context="module">
  export type FactoryTypes = {
    [name: string]: { new (params: { target: HTMLElement }): object };
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { LayoutConfig, type ComponentContainer } from "golden-layout";
  import { GoldenLayout } from "golden-layout";
  import Events from "../../events";
  import { Application } from "../../core/application";

  export let layoutConfig: LayoutConfig;
  export let factoryTypes: FactoryTypes;

  let container: HTMLElement;

  onMount(() => {
    const layout = new GoldenLayout(container);

    layout.resizeWithContainerAutomatically = true;

    for (const [name, Ctor] of Object.entries(factoryTypes)) {
      layout.registerComponentFactoryFunction(name, (container: ComponentContainer) => {
        new Ctor({ target: container.element });
      });
    }

    Application.instance.layout = layout;

    const savedConfig = localStorage.getItem("comet:layout");
    if (savedConfig) {
      const data = JSON.parse(savedConfig);
      let persistGoldenLayoutConfig;

      try {
        if ("resolved" in data) {
          persistGoldenLayoutConfig = LayoutConfig.fromResolved(data);
        } else {
          persistGoldenLayoutConfig = data as unknown as LayoutConfig;
        }

        layout.loadLayout(persistGoldenLayoutConfig);
      } catch (e) {
        console.warn("Failed to load saved layout config", e);
        layout.loadLayout(layoutConfig);
      }
    } else {
      layout.loadLayout(layoutConfig);
    }

    layout.on("stateChanged", () => {
      const config = layout.saveLayout();
      localStorage.setItem("comet:layout", JSON.stringify(config));

      Events.editor.resize.emit();
    });
  });
</script>

<panel-layout bind:this={container}>
  <!-- custom tags need a closing tag -->
</panel-layout>

<style>
  panel-layout {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
