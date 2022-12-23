<script lang="ts">
  import { getApp } from "../../core/application";
  import type { Tool } from "../../core/tool";
  import Events from "../../events";
  import { Tools } from "../../tools/tools";
  import ToolButton from "./components/toolButton.svelte";

  const app = getApp();

  let tools: (Tool | "-")[] = [Tools.select, "-", Tools.newSprite, Tools.newContainer];
  let selected = app.currentTool().id;

  Events.tool.select.bind((tool) => {
    selected = tool.id;
  });
</script>

<tool-panel>
  <div class="container">
    {#each tools as tool}
      {#if tool === "-"}
        <tool-separator />
      {:else}
        <ToolButton {tool} selected={tool.id === selected} />
      {/if}
    {/each}
  </div>
</tool-panel>

<style>
  tool-panel {
    background-color: var(--panel-bg-color-dark);
    width: 50px;
    height: 100%;
    padding: 5px;
    padding-top: 32px;
    margin-right: 3px;
    flex-grow: 0;
  }

  .container {
    background-color: var(--panel-bg-color-dark);
    width: 100%;
    height: 100%;
  }

  tool-separator {
    width: 100%;
    height: 2px;
    background-color: #000;
    margin-top: 5px;
    margin-bottom: 10px;
    display: block;
    border-bottom: 1px solid #535353;
  }
</style>
