<script lang="ts">
  import { nextTick } from "../../../core/util";
  import Events from "../../events";
  import type { MenuItem } from "./components/menu";
  import { menu } from "./menuBar";
  import MenuBarItem from "./menuBarItem.svelte";

  let selected: MenuItem | undefined = undefined;

  $: items = menu.getItems();

  const onSelect = ({ detail: item }: CustomEvent) => {
    if (item.label === selected?.label) {
      selected = undefined;
      nextTick().then(() => Events.contextMenu.close.emit());
      return;
    }

    nextTick().then(() => {
      items = menu.getItems();
      selected = item;
    });
  };
</script>

<menu-bar>
  {#each items as item}
    <MenuBarItem
      {item}
      on:select={onSelect}
      selected={item === selected}
      on:close={() => (selected = undefined)}
    />
  {/each}
</menu-bar>

<style>
  menu-bar {
    height: 25px;
    background-color: var(--panel-bg-color-light);
    width: 100%;
    flex-grow: 0;
    display: flex;
    padding-left: 60px;
    align-items: center;
  }
</style>
