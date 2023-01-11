<script lang="ts">
  import type { Menu } from "./menu";
  import ContextMenu from "./contextMenu.svelte";
  import { indentationWidth, TreeViewModel } from "./treeModel";
  import { scale } from "svelte/transition";

  export let tree: TreeViewModel<any, any>;
  export let menu: Menu | undefined = undefined;
  export let cssClass: string | undefined = undefined;

  export function selectPrev() {
    tree.selectPrev();
  }

  export function selectNext() {
    tree.selectNext();
  }

  let container: HTMLElement;

  const { model, dragTarget, isEditing } = tree.store;

  const onTreeMouseOver = (e: MouseEvent) => tree.onTreeMouseOver(e);
  const onTreeMouseOut = (e: MouseEvent) => tree.onTreeMouseOut(e);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<tree-view
  bind:this={container}
  on:mouseenter={onTreeMouseOver}
  on:mouseleave={onTreeMouseOut}
  class={`tree-view ${cssClass ?? ""}`}
>
  {#each $model as item (item.id)}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div
      class="tree-item"
      class:selected={item.isSelected}
      class:isPrimary={tree.isPrimarySelection(item)}
      class:visible={item.isVisible}
      class:hidden={!item.isVisible}
      class:dragTargetRow={$dragTarget === item && !tree.doesSelectionContainItem(item)}
      on:mousedown={(e) => tree.onRowMouseDown(e, item)}
      on:mouseover={(e) => tree.onRowMouseOver(e, item)}
    >
      <span class="indentation no-events" style="padding-left:{item.depth * indentationWidth}px"
        >&nbsp;</span
      >

      {#if tree.hasChildren(item.data)}
        <span
          class="arrow"
          class:expanded={item.isExpanded}
          class:collapsed={!item.isExpanded}
          on:mousedown={(e) => tree.toggleItemExpanded(e, item)}
        />
      {:else}
        <span class="arrow-filler no-events" on:click={(e) => tree.toggleItemExpanded(e, item)} />
      {/if}

      {#if item.icon}
        <img class="icon no-events" src={item.icon} alt={tree.getLabel(item.data)} />
      {/if}

      <!-- svelte-ignore a11y-missing-attribute -->
      <a
        title={tree.getId(item)}
        class="label"
        class:selected={item.isSelected}
        contenteditable={$isEditing}
        data-id="tree-view-label-edit"
      >
        {tree.getLabel(item.data)}
        {#if tree.isItemReParentDragTarget(item, $dragTarget)}
          <div
            transition:scale={{ duration: 150 }}
            class="dragTargetIndicator reparent no-events"
          />
        {/if}
      </a>

      {#if tree.isItemReOrderDragTarget(item, $dragTarget)}
        <div transition:scale={{ duration: 150 }} class="dragTargetIndicator reorder no-events" />
      {/if}
    </div>
  {/each}
  {#if menu}
    <ContextMenu {menu} {container} />
  {/if}
</tree-view>

<style>
  tree-view {
    width: 100%;
    height: 100%;
    user-select: none;
    padding: 5px;
    display: block;
    border: 1px outset #666a;
    border-radius: 5px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .tree-item {
    font-size: 12px;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    height: 24px;
    transition: opacity 0.15s ease-out, height 0.15s ease-out;
    opacity: 1;
    overflow: hidden;
  }

  .tree-item.selected {
    background-color: #2eb2c8b3;
  }

  .tree-item.selected.isPrimary {
    background-color: #2eb2c8;
  }

  .tree-view.project .tree-item.selected {
    background-color: #2e66c8;
  }

  .tree-item.hidden {
    height: 0;
    opacity: 0;
  }

  .tree-item span {
    display: inline-block;
  }

  .label {
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
  }

  .label.selected {
    font-weight: bold;
    color: black;
  }

  .no-events {
    pointer-events: none;
  }

  .indentation {
    display: inline-block;
    height: 10px;
  }

  .arrow-filler {
    display: inline-block;
    padding-left: 13px;
    height: 10px;
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
    margin-right: 0;
  }

  .arrow.expanded {
    border-top: 8px solid #ccc;
    position: relative;
    top: 2px;
    margin-right: 3px;
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

  .icon {
    width: 16px;
    margin-right: 5px;
  }
</style>
