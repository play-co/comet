<script lang="ts">
  import { onMount } from "svelte";
  import { delay } from "../../core/util";
  import { Application } from "../application";
  import { getUrlParam } from "../util";
  import MainLayout from "./MainLayout.svelte";

  let isConnected = false;
  let connectionError: Error | undefined;

  function connect() {
    Application.instance
      .connect()
      .then(() => {
        isConnected = true;
      })
      .catch((e) => {
        connectionError = e;
      });
  }

  onMount(() => {
    if (getUrlParam<number>("connect") === 1) {
      connect();
    } else {
      delay(1000).then(() => connect());
    }
  });
</script>

<main>
  {#if connectionError}
    <div class="error">{connectionError}</div>
  {:else if isConnected}
    <MainLayout />
  {:else}
    <div class="fill flex-container-center">
      <button on:click={() => connect()}>Connect</button>
    </div>
  {/if}
</main>

<style>
  main {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .error {
    font-weight: bold;
    text-align: center;
    background-color: red;
    color: white;
    position: absolute;
  }

  .error {
    top: 0;
    left: 0;
    right: 0;
    height: 20px;
  }
</style>
