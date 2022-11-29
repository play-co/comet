<script lang="ts">
  import { getGlobalEmitter } from "../../../core/events";
  import type { DisplayObjectNode } from "../../../core/nodes/abstract/displayObject";
  import { SetParentCommand } from "../../commands/setParent";
  import { Application } from "../../core/application";
  import type { CommandEvent } from "../../events/commandEvents";
  import type { DatastoreEvent } from "../../events/datastoreEvents";
  import type { SelectionEvent } from "../../events/selectionEvents";
  import type { ViewportEvent } from "../../events/viewportEvents";
  import { mouseDrag } from "../components/dragger";
  import Panel from "./components/panel.svelte";

  interface ModelItem {
    depth: number;
    node: DisplayObjectNode;
    isSelected: boolean;
    isExpanded: boolean;
    isVisible: boolean;
  }

  enum Operation {
    Reparent,
    Reorder,
  }

  const viewportEmitter = getGlobalEmitter<ViewportEvent>();
  const selectionEmitter = getGlobalEmitter<SelectionEvent>();
  const datastoreEmitter = getGlobalEmitter<DatastoreEvent>();
  const commandEmitter = getGlobalEmitter<CommandEvent>();

  const { selection, viewport } = Application.instance;

  // view state

  let model: ModelItem[] = [];
  let root: DisplayObjectNode = viewport.rootNode;
  let isDragging: boolean = false;
  let dragTarget: ModelItem | undefined = undefined;
  let operation: Operation = Operation.Reparent;

  // view functions

  function generateModel() {
    const newModel = root.walk<DisplayObjectNode, { model: ModelItem[] }>(
      (node, options) => {
        if (node.isCloaked) {
          // deleted nodes are actually just cloaked, don't include them
          return;
        }

        options.data.model.push({
          depth: options.depth,
          isSelected: selection.shallowContains(node),
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
    model = newModel;
  }

  function updateModel(fn: (item: ModelItem) => void) {
    model.forEach(fn);
    refresh();
  }

  function refresh() {
    model = [...model];
  }

  function toggleItemExpanded(e: MouseEvent, item: ModelItem) {
    const index = model.indexOf(item);

    item.isExpanded = !item.isExpanded;

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

  function selectItem(e: MouseEvent, item: ModelItem): void | false {
    const { node } = item;

    if (e.shiftKey || e.metaKey) {
      if (selection.shallowContains(node)) {
        // remove from selection
        selection.remove(node);
        return false;
      } else {
        // add to selection
        selection.add(node);
      }
    } else if (!selection.shallowContains(node)) {
      // replace selection if not already selected
      selection.set(node);
    }
  }

  function startDrag(e: MouseEvent, item: ModelItem) {
    if (selectItem(e, item) === false) {
      // item was removed from selection, abort drag
      return;
    }

    isDragging = true;
    operation =
      selection.isSingle && e.altKey ? Operation.Reorder : Operation.Reparent;

    mouseDrag(e).then(() => {
      if (isDragging && dragTarget) {
        const dragTargetNode = (dragTarget as ModelItem).node;

        selection.forEach((node) => {
          const sourceNode = node;

          if (operation === Operation.Reparent) {
            // reparent using command
            Application.instance.undoStack.exec(
              new SetParentCommand({
                nodeId: sourceNode.id,
                parentId: dragTargetNode.id,
              })
            );
          } else {
            // reorder using command
            const sourceNode = selection.nodes[0];
            const parentNode =
              dragTargetNode === sourceNode.parent
                ? dragTargetNode
                : (dragTargetNode.parent as DisplayObjectNode);

            const index =
              dragTargetNode === sourceNode.parent
                ? 0
                : parentNode.indexOf(dragTargetNode) + 1;

            parentNode.setChildIndex(sourceNode, index);
          }

          generateModel();
        });
      }

      clearDrag();
    });
  }

  function dragOver(_e: MouseEvent, item: ModelItem) {
    if (isDragging) {
      if (operation === Operation.Reorder) {
        item.node.isSiblingOf(selection.nodes[0]) ||
        item.node === selection.nodes[0].parent
          ? (dragTarget = item)
          : (dragTarget = undefined);
      } else {
        selection.shallowContains(item.node)
          ? (dragTarget = undefined)
          : (dragTarget = item);
      }
    }
  }

  function clearDrag() {
    isDragging = false;
    dragTarget = undefined;
  }

  // handlers

  const onViewportRootChanged = (node: DisplayObjectNode) => {
    root = node;
    generateModel();
  };

  const onSelectionChanged = () => {
    updateModel((item) => {
      item.isSelected = selection.shallowContains(item.node);
    });
  };

  const onDeselect = () => {
    updateModel((item) => {
      item.isSelected = false;
    });
  };

  // bind to global events

  viewportEmitter.on("viewport.root.changed", onViewportRootChanged);

  selectionEmitter
    .on("selection.add", onSelectionChanged)
    .on("selection.remove", onSelectionChanged)
    .on("selection.set", onSelectionChanged)
    .on("selection.deselect", onDeselect);

  datastoreEmitter
    .on("datastore.remote.node.parent.set", generateModel)
    .on("datastore.local.node.created", generateModel)
    .on("datastore.local.node.cloaked", generateModel)
    .on("datastore.local.node.uncloaked", generateModel);

  commandEmitter
    .on("command.undo", generateModel)
    .on("command.redo", generateModel)
    .on("command.exec", generateModel);

  // populate current model

  generateModel();
</script>

<hierarchy-panel>
  <Panel>
    <table>
      <tbody>
        {#each model as item (item.node.id)}
          <tr>
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <td
              class={[
                item.isSelected ? "selected" : "",
                item.isVisible ? "visible" : "hidden",
                dragTarget === item && !selection.shallowContains(item.node)
                  ? "dragTargetRow"
                  : "",
              ].join(" ")}
              on:mousedown={(e) => startDrag(e, item)}
              on:mouseover={(e) => dragOver(e, item)}
              ><span class="indentation" style="width:{item.depth * 10}px" />
              {#if item.node.hasChildren}<span
                  on:click={(e) => toggleItemExpanded(e, item)}
                  class="arrow {item.isExpanded
                    ? 'expanded'
                    : 'collapsed'}" />{:else}<span class="arrow-filler" />{/if}

              <span class="label {item.isSelected ? 'selected' : ''}"
                >{item.node
                  .id}{#if dragTarget === item && !selection.shallowContains(item.node) && operation === Operation.Reparent}
                  <div class="dragTargetIndicator reparent" />{/if}</span>
              {#if dragTarget === item && !selection.shallowContains(item.node) && operation === Operation.Reorder}
                <div class="dragTargetIndicator reorder" />{/if}
            </td>
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
    margin: 5px;
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
    position: relative;
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

  .dragTargetIndicator {
    height: 3px;
    width: 100%;
    position: absolute;
    bottom: 0;
  }

  .reparent {
    background-color: #00f9ff;
  }

  .reorder {
    background-color: #00ff3c;
  }

  .dragTargetRow {
    background-color: #00a7ff24;
  }
</style>
