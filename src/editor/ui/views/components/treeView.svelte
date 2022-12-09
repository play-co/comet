<script lang="ts">
  import Panel from "./panel.svelte";
  import { Operation, type TreeViewModel } from "./treeView";

  export let tree: TreeViewModel<any>;

  const { model, dragTarget, operation } = tree.store;
</script>

<hierarchy-panel>
  <Panel>
    <table>
      <tbody>
        {#each $model as item (item.data.id)}
          <tr>
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <td
              class={[
                item.isSelected ? "selected" : "",
                item.isVisible ? "visible" : "hidden",
                $dragTarget === item && !tree.doesSelectionContainItem(item)
                  ? "dragTargetRow"
                  : "",
              ].join(" ")}
              on:mousedown={(e) => tree.onRowMouseDown(e, item)}
              on:mouseover={(e) => tree.onRowMouseOver(e, item)}
              ><span class="indentation" style="width:{item.depth * 10}px" />
              {#if item.data.hasChildren}<span
                  on:click={(e) => tree.toggleItemExpanded(e, item)}
                  class="arrow {item.isExpanded
                    ? 'expanded'
                    : 'collapsed'}" />{:else}<span class="arrow-filler" />{/if}

              <span class="label {item.isSelected ? 'selected' : ''}"
                >{item.data
                  .id}{#if $dragTarget === item && !tree.doesSelectionContainItem(item) && $operation === Operation.ReParent}
                  <div class="dragTargetIndicator reparent" />{/if}</span>
              {#if $dragTarget === item && !tree.doesSelectionContainItem(item) && $operation === Operation.ReOrder}
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

  /* th {
    position: sticky;
    top: 0;
    background-color: #000000;
  } */

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
    pointer-events: none;
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
