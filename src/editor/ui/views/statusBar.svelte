<script lang="ts">
  import { getApp } from "../../core/application";
  import StatusBarItem from "./statusBarItem.svelte";

  const app = getApp();
  const statusBar = app.statusBar;
  const { message, items } = statusBar.$store;
</script>

<status-bar>
  <pre class="message">{$message}</pre>
  {#each $items as item}
    <StatusBarItem {item} />
  {/each}
</status-bar>

<style>
  status-bar {
    height: 25px;
    background-color: var(--panel-bg-color-dark);
    width: 100%;
    flex-grow: 0;
    padding-left: 60px;
    font-size: 12px;
    display: flex;
    align-items: center;
    padding-bottom: 7px;
    position: relative;
    padding-right: 10px;
  }

  .message {
    flex-grow: 1;
    color: #90b7c1;
  }
</style>
