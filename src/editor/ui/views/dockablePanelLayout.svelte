<script lang="ts">
  import { onMount } from "svelte";
  import { ComponentContainer, GoldenLayout, LayoutConfig } from "golden-layout";
  import Events from "../../events";
  import { Application } from "../../core/application";
  import { loadUserLayoutPrefs, saveUserLayoutPrefs } from "../../core/userPrefs";
  import type { FactoryTypes } from "./dockablePanelLayout";

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

    const savedConfig = loadUserLayoutPrefs();
    layout.loadLayout(savedConfig ?? layoutConfig);

    layout.on("stateChanged", () => {
      saveUserLayoutPrefs();

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
