<script lang="ts">
  import Menubar from "./Menubar.svelte";
  import Viewport from "./Viewport.svelte";
  import { Application } from "../application";

  Application.instance.init();
</script>

<div data-id="main-layout">
  <div class="header">
    <Menubar />
  </div>
  <div class="body">
    <Viewport />
  </div>
</div>

<style>
  [data-id="main-layout"] {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--main-bg-color);
  }

  .header {
    flex-grow: 0;
    height: 30px;
  }

  .body {
    flex-grow: 1;
  }
</style>
