<script lang="ts">
  import { onMount } from "svelte";
  import { delay } from "../../../core/util";
  import { Application } from "../../core/application";
  import { getUrlParam } from "../../util";
  import MainLayout from "./mainLayout.svelte";
  import ModalDialog from "./components/modalDialog.svelte";
  import Events from "../../events";

  let isConnected = false;
  let connectionError: Error | undefined;
  let isReady = false;

  onMount(() => {
    // show the splash
    // Events.dialog.modal.open.emit("splash");

    Events.project.ready.bind(() => {
      isReady = true;
    });
  });

  function connect() {
    Application.instance
      .connect()
      .then(() => {
        Application.instance.init();
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

<main class:loading={!isReady}>
  {#if connectionError}
    <div class="error">{connectionError}</div>
  {:else if isConnected}
    <MainLayout />
  {:else}
    <div class="connect">
      <button on:click={() => connect()}>Connect</button>
    </div>
  {/if}
  <ModalDialog />
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
    top: 0;
    left: 0;
    right: 0;
    height: 20px;
  }

  .connect {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
