<script lang="ts">
  import { menu } from "./menuBar";
  import MenuBarItem from "./menuBarItem.svelte";
</script>

<menu-bar>
  {#each menu.getItems() as item}
    <MenuBarItem {item} />
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
