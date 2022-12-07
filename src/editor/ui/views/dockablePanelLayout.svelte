<script lang="ts" context="module">
  export type FactoryTypes = {
    [name: string]: { new (params: { target: HTMLElement }): object };
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import type { ComponentContainer, LayoutConfig } from "golden-layout";
  import { GoldenLayout } from "golden-layout";
  import Events from "../../events";

  export let layoutConfig: LayoutConfig;
  export let factoryTypes: FactoryTypes;

  let container: HTMLElement;

  onMount(() => {
    const layout = new GoldenLayout(container);

    layout.resizeWithContainerAutomatically = true;

    for (const [name, Ctor] of Object.entries(factoryTypes)) {
      layout.registerComponentFactoryFunction(
        name,
        (container: ComponentContainer) => {
          new Ctor({ target: container.element });
        }
      );
    }

    layout.loadLayout(layoutConfig);
    layout.on("stateChanged", () => {
      Events.viewport.resize.emit();
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
