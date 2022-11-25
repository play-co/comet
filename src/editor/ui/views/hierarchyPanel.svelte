<script lang="ts">
  import { getGlobalEmitter } from "../../../core/events";
  import { DisplayObjectNode } from "../../../core/nodes/abstract/displayObject";
  import { nodeClasses } from "../../../core/nodes/nodeFactory";
  import { Application } from "../../core/application";
  import type { ViewportEvent } from "../../events/viewportEvents";
  import Panel from "./components/panel.svelte";

  const viewportEmitter = getGlobalEmitter<ViewportEvent>();

  interface ModelItem {
    depth: number;
    node: DisplayObjectNode;
  }

  let model: ModelItem[] = [];
  let root: DisplayObjectNode = Application.instance.viewport.rootNode;

  function generateModel() {
    const array = root.walk<DisplayObjectNode, ModelItem[]>(
      (node, options) => {}
    );
  }

  viewportEmitter.on("viewport.root.changed", (node: DisplayObjectNode) => {
    root = node;
    generateModel();
  });

  generateModel();
</script>

<hierarchy-panel>
  <Panel>Hierarchy...</Panel>
</hierarchy-panel>

<style>
  hierarchy-panel {
    width: 100%;
    height: 100%;
  }
</style>
