<script lang="ts">
  import { onMount } from "svelte";
  import type { ComponentContainer, LayoutConfig } from "golden-layout";
  import { GoldenLayout } from "golden-layout";
  import { getGlobalEmitter } from "../../../core/events";
  import type { ViewportEvent } from "../../events/viewportEvents";
  import Viewport from "./viewport.svelte";
  import type { EditableView } from "../components/editableView";

  let container: HTMLElement;

  const layoutConfig: LayoutConfig = {
    root: {
      type: "stack",
      content: [],
    },
    dimensions: {
      headerHeight: 30,
    },
  };

  onMount(() => {
    const layout = new GoldenLayout(container);

    layout.resizeWithContainerAutomatically = true;

    let activeView: EditableView;

    layout.registerComponentFactoryFunction(
      "Viewport",
      (container: ComponentContainer) => {
        new Viewport({
          props: { editableView: activeView },
          target: container.element,
        });
      }
    );

    layout.loadLayout(layoutConfig);

    const globalEmitter = getGlobalEmitter<ViewportEvent>();
    globalEmitter.on("viewport.open", (editableView) => {
      activeView = editableView;
      layout.addComponent("Viewport", undefined, activeView.title);
    });
  });
</script>

<docable-viewports bind:this={container}>
  <!-- custom tags need a closing tag -->
</docable-viewports>

<style>
  docable-viewports {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
