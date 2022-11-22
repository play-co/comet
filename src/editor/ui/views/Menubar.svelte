<script lang="ts">
  import { getGlobalEmitter } from "../../../core/events";
  import { Actions } from "../../actions";
  import type { ProjectEvent } from "../../events/projectEvents";
  let isReady = false;
  const globalEmitter = getGlobalEmitter<ProjectEvent>();
  globalEmitter.on("project.ready", () => (isReady = true));
</script>

<menu-bar>
  {#if isReady}
    <button on:click={() => Actions.newContainer.dispatch()}
      >New Container</button>
    <button
      on:click={() =>
        Actions.newSprite.dispatch({
          addToSelected: true,
        })}>New Node</button>
  {/if}
</menu-bar>

<style>
  menu-bar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--menubar-bg-color);
  }

  button {
    margin: 0 5px;
  }
</style>
