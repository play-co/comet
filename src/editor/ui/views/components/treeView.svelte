<script lang="ts">
  import type { TreeViewModel } from "./treeView";

  export let tree: TreeViewModel<any>;

  const { model, dragTarget } = tree.store;
</script>

<tree-view>
  {#each $model as item (item.id)}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div
      class={[
        "tree-item",
        item.isSelected ? "selected" : "",
        item.isVisible ? "visible" : "hidden",
        $dragTarget === item && !tree.doesSelectionContainItem(item)
          ? "dragTargetRow"
          : "",
      ].join(" ")}
      on:mousedown={(e) => tree.onRowMouseDown(e, item)}
      on:mouseover={(e) => tree.onRowMouseOver(e, item)}>
      <span class="indentation" style="width:{item.depth * 10}px" />
      {#if tree.hasChildren(item.data)}
        <span class="arrow {item.isExpanded ? 'expanded' : 'collapsed'}" />
      {:else}
        <span
          class="arrow-filler"
          on:click={(e) => tree.toggleItemExpanded(e, item)} />
      {/if}
      <span class="label {item.isSelected ? 'selected' : ''}">
        {tree.getId(item)}
        {#if tree.isItemReParentDragTarget(item, $dragTarget)}
          <div class="dragTargetIndicator reparent" />
        {/if}
      </span>
      {#if tree.isItemReOrderDragTarget(item, $dragTarget)}
        <div class="dragTargetIndicator reorder" />
      {/if}
    </div>
  {/each}
</tree-view>

<style>
  tree-view {
    width: 100%;
    height: 100%;
    user-select: none;
  }

  .tree-item {
    font-size: 12px;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
  }

  .tree-item.selected {
    background-color: #2eb2c8;
  }

  .tree-item.hidden {
    display: none;
  }

  .tree-item span {
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
