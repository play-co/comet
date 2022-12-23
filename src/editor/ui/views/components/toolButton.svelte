<script lang="ts">
  import { getApp } from "../../../core/application";
  import type { Tool } from "../../../core/tool";

  export let tool: Tool;
  export let selected: boolean;
</script>

<tool-button class:selected on:click={() => getApp().setTool(tool)}>
  <!-- svelte-ignore a11y-missing-attribute -->
  <a title={tool.options.tip}>
    <img src={tool.options.icon} draggable="false" alt={tool.options.tip} />
  </a>
</tool-button>

<style>
  tool-button {
    width: 40px;
    height: 40px;
    border-radius: 5px;
    background-color: var(--panel-bg-color-light);
    cursor: pointer;
    border: 1px outset #a699998f;
    margin-bottom: 8px;
    display: block;
    position: relative;
  }

  tool-button.selected {
    background-color: #555;
    border: 1px inset #00c1ff;
  }

  tool-button:hover {
    background-color: var(--control-hover);
  }

  tool-button:active {
    background-color: var(--control-active);
  }

  a {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  img:active {
    position: relative;
    top: 2px;
    left: 2px;
  }

  img {
    width: 30px;
    user-select: none;
  }

  tool-button.selected img {
    position: relative;
    left: 2px;
    top: 2px;
  }
</style>
