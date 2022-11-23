<script lang="ts">
  import Menubar from "./menubar.svelte";
  import Viewport from "./viewport.svelte";
  import { Application } from "../../core/application";

  Application.instance.init();
</script>

<main-layout>
  <div class="header">
    <Menubar />
  </div>
  <div class="body">
    <Viewport />
  </div>
</main-layout>

<style>
  main-layout {
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
