<script lang="ts">
  import { getGlobalEmitter } from "../../../core/events";
  import type { DisplayObjectNode } from "../../../core/nodes/abstract/displayObject";
  import { Application } from "../../core/application";
  import type { SelectionEvent } from "../../events/selectionEvents";
  import type { ViewportEvent } from "../../events/viewportEvents";
  import Panel from "./components/panel.svelte";

  const viewportEmitter = getGlobalEmitter<ViewportEvent>();
  const selectionEmitter = getGlobalEmitter<SelectionEvent>();

  interface ModelItem {
    depth: number;
    node: DisplayObjectNode;
  }

  let model: ModelItem[] = [];
  let root: DisplayObjectNode = Application.instance.viewport.rootNode;

  function generateModel() {
    model = root.walk<DisplayObjectNode, { model: ModelItem[] }>(
      (node, options) => {
        options.data.model.push({
          depth: options.depth,
          node,
        });
      },
      {
        data: {
          model: [],
        },
      }
    ).model;
  }

  const onViewportRootChanged = (node: DisplayObjectNode) => {
    root = node;
    generateModel();
  };

  const onSelectionChanged = () => {
    console.log("!");
  };

  viewportEmitter.on("viewport.root.changed", onViewportRootChanged);

  selectionEmitter
    .on("selection.add", onSelectionChanged)
    .on("selection.remove", onSelectionChanged)
    .on("selection.set", onSelectionChanged)
    .on("selection.deselect", onSelectionChanged);

  generateModel();
</script>

<hierarchy-panel>
  <Panel>
    <table>
      <thead>
        <tr>
          <th>Node</th>
        </tr>
      </thead>
      <tbody>
        {#each model as item}
          <tr>
            <td
              ><span style="width:{item.depth * 10}px" />
              {#if item.node.hasChildren}<span class="arrow-down" />{:else}<span
                  class="arrow-filler" />{/if}
              <span>{item.node.id}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Panel>
</hierarchy-panel>

<style>
  hierarchy-panel {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 12px;
  }

  th {
    position: sticky;
    top: 0;
    background-color: #000000;
  }

  td span {
    display: inline-block;
  }

  .arrow-filler {
    display: inline-block;
    width: 10px;
    height: 5px;
  }

  .arrow-right {
    display: inline-block;
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 8px solid #ccc;
  }

  .arrow-down {
    display: inline-block;
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid #ccc;
  }
</style>
