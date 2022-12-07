<script lang="ts">
  import { Actions } from "../../actions";
  import Events from "../../events";

  let isReady = false;

  Events.project.ready.bind(() => (isReady = true));
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
  }

  button {
    margin: 0 5px;
  }
</style>
