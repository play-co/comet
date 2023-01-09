<script lang="ts">
  import { getApp } from "../../core/application";
  import Events from "../../events";
  import StatusBarItem from "./statusBarItem.svelte";

  const app = getApp();
  const statusBar = app.statusBar;
  const { message, items } = statusBar.$store;

  let error: string | null = null;

  Events.error.global.bind((e) => {
    error = `Error: "${e.message}"`;
    app.statusBar.setMessage(error);
  });

  Events.error.unhandledrejection.bind((e) => {
    error = `Unhandled Rejection: "${e.reason.message}"`;
    app.statusBar.setMessage(error);
  });
</script>

<status-bar>
  <pre class="message" class:error={error !== null}>{$message}</pre>
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
    padding-left: 10px;
    margin-right: 10px;
  }

  .error {
    background-color: #970000;
    border: 1px outset #f00;
    color: #fff;
    font-weight: bold;
    border-radius: 3px;
  }
</style>
