<script lang="ts">
  import { getGlobalEmitter } from "../../../core/events";
  import type { DisplayObjectNode } from "../../../core/nodes/abstract/displayObject";
  import { Application } from "../../core/application";
  import type { DatastoreEvent } from "../../events/datastoreEvents";
  import type { SelectionEvent } from "../../events/selectionEvents";
  import type { ViewportEvent } from "../../events/viewportEvents";
  import Panel from "./components/panel.svelte";

  const viewportEmitter = getGlobalEmitter<ViewportEvent>();
  const selectionEmitter = getGlobalEmitter<SelectionEvent>();
  const datastoreEmitter = getGlobalEmitter<DatastoreEvent>();

  interface ModelItem {
    depth: number;
    node: DisplayObjectNode;
    isSelected: boolean;
    isExpanded: boolean;
    isVisible: boolean;
  }

  let model: ModelItem[] = [];
  let root: DisplayObjectNode = Application.instance.viewport.rootNode;

  function generateModel() {
    model = root.walk<DisplayObjectNode, { model: ModelItem[] }>(
      (node, options) => {
        if (node.isCloaked) {
          return;
        }
        options.data.model.push({
          depth: options.depth,
          isSelected: Application.instance.selection.shallowContains(node),
          isExpanded: true,
          isVisible: true,
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

  function updateModel(fn: (item: ModelItem) => void) {
    model.forEach(fn);
    refresh();
  }

  function refresh() {
    model = [...model];
  }

  function toggleItemExpanded(e: MouseEvent, item: ModelItem) {
    item.isExpanded = !item.isExpanded;
    const index = model.indexOf(item);
    for (let i = index + 1; i <= model.length - 1; i++) {
      const subItem = model[i];
      if (subItem.depth > item.depth) {
        subItem.isVisible = item.isExpanded;
      } else if (subItem.depth <= item.depth) {
        break;
      }
    }
    item.isVisible = true;
    e.stopPropagation();
    refresh();
  }

  function selectItem(e: MouseEvent, item: ModelItem) {
    if (e.shiftKey || e.metaKey) {
      Application.instance.selection.add(item.node);
    } else {
      Application.instance.selection.set(item.node);
    }
  }

  const onViewportRootChanged = (node: DisplayObjectNode) => {
    root = node;
    generateModel();
  };

  const onSelectionChanged = () => {
    updateModel((item) => {
      item.isSelected = Application.instance.selection.shallowContains(
        item.node
      );
    });
  };

  const onDeselect = () => {
    updateModel((item) => {
      item.isSelected = false;
    });
  };

  viewportEmitter.on("viewport.root.changed", onViewportRootChanged);

  selectionEmitter
    .on("selection.add", onSelectionChanged)
    .on("selection.remove", onSelectionChanged)
    .on("selection.set", onSelectionChanged)
    .on("selection.deselect", onDeselect);

  datastoreEmitter
    .on("datastore.local.node.created", generateModel)
    .on("datastore.local.node.cloaked", generateModel)
    .on("datastore.local.node.uncloaked", generateModel);

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
        {#each model as item (item.node.id)}
          <tr>
            <td
              class={[
                item.isSelected ? "selected" : "",
                item.isVisible ? "visible" : "hidden",
              ].join(" ")}
              on:click={(e) => selectItem(e, item)}
              ><span class="indentation" style="width:{item.depth * 10}px" />
              {#if item.node.hasChildren}<span
                  on:click={(e) => toggleItemExpanded(e, item)}
                  class="arrow {item.isExpanded
                    ? 'expanded'
                    : 'collapsed'}" />{:else}<span class="arrow-filler" />{/if}
              <span class="label {item.isSelected ? 'selected' : ''}"
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
    user-select: none;
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

  td.hidden {
    display: none;
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
