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
    isSelected: boolean;
    isExpanded: boolean;
  }

  let model: ModelItem[] = [];
  let root: DisplayObjectNode = Application.instance.viewport.rootNode;

  function generateModel() {
    model = root.walk<DisplayObjectNode, { model: ModelItem[] }>(
      (node, options) => {
        options.data.model.push({
          depth: options.depth,
          isSelected: Application.instance.selection.shallowContains(node),
          isExpanded: true,
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

  function refresh() {
    model = [...model];
  }

  const toggleItemExpanded = (item: ModelItem) => {
    item.isExpanded = !item.isExpanded;
    refresh();
  };

  const onViewportRootChanged = (node: DisplayObjectNode) => {
    root = node;
    generateModel();
  };

  const onSelectionChanged = () => {
    model.forEach((item) => {
      item.isSelected = Application.instance.selection.shallowContains(
        item.node
      );
    });
    refresh();
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
            <td class={item.isSelected ? "selected" : undefined}
              ><span class="indentation" style="width:{item.depth * 10}px" />
              {#if item.node.hasChildren}<span
                  on:click={() => toggleItemExpanded(item)}
                  class="arrow {item.isExpanded
                    ? 'expanded'
                    : 'collapsed'}" />{:else}<span class="arrow-filler" />{/if}
              <span class="label {item.isSelected ? 'selected' : undefined}"
                >{item.node.id}</span
              ></td>
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

  td {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  td.selected {
    background-color: #2eb2c8;
  }

  td span {
    display: inline-block;
  }

  .label.selected {
    font-weight: bold;
    color: black;
  }

  .arrow-filler {
    display: inline-block;
    width: 10px;
    height: 5px;
  }

  .arrow {
    display: inline-block;
    width: 0;
    height: 0;
    border: 5px solid transparent;
    cursor: pointer;
  }

  .arrow.collapsed {
    border-left: 8px solid #ccc;
    margin-right: 2px;
  }

  .arrow.expanded {
    border-top: 8px solid #ccc;
    position: relative;
    top: 2px;
    margin-right: 5px;
  }
</style>
