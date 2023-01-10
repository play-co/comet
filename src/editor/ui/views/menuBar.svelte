<script lang="ts">
  import { nextTick } from "../../../core/util";
  import { getApp } from "../../core/application";
  import Events from "../../events";
  import type { MenuItem } from "./components/menu";
  import { menu } from "./menuBar";
  import MenuBarItem from "./menuBarItem.svelte";

  const app = getApp();

  let selected: MenuItem | undefined = undefined;
  let projectId = "";

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

  Events.project.ready.bind(() => {
    projectId = app.datastore.getProjectId();
  });
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
  <div class="project-info">{projectId}</div>
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
    position: relative;
  }

  .project-info {
    position: absolute;
    right: 7px;
    top: 1px;
    font-size: 11px;
    color: #aaa;
  }
</style>
