<script lang="ts">
  import ToolButton from "./components/toolButton.svelte";
  import { Icons } from "./icons";
</script>

<tool-panel>
  <div class="container">
    <ToolButton icon={Icons.Sprite} tip="New Sprite" />
    <tool-separator />
    <ToolButton icon={Icons.Container} tip="New Container" />
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
