<script lang="ts">
  import { scale } from "svelte/transition";
  import { backOut } from "svelte/easing";
  import { getApp } from "../../../core/application";
  import Events from "../../../events";
  let message = "";

  $: isReady = getApp().project.isReady;

  const onClick = () => {
    Events.dialog.modal.close.emit();
  };

  Events.dialog.modal.close.bind(() => (message = ""));

  Events.datastore.connection.attempt.bind(() => {
    message = "Connecting...";
  });

  Events.project.open.attempt.bind(() => {
    message = "Opening project...";
  });

  Events.project.ready.bind(() => {
    message = "Let's go!";
    isReady = true;
    setTimeout(() => {
      onClick();
    }, 250);
  });
</script>

<dialog-splash on:click={onClick} on:click={onClick} class:isReady>
  <img src="/assets/logo.png" alt="Comet" transition:scale={{ duration: 800, easing: backOut }} />
  <div class="message">{message}</div>
  <div class="info">version: pre-alpha</div>
</dialog-splash>

<style>
  dialog-splash {
    width: 500px;
    height: 200px;
    background-color: #232323;
    border: 3px outset #2e2e2e;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-shadow: 7px 13px 20px #0000003d;
    position: relative;
    border-radius: 10px;
  }

  .isReady {
    cursor: pointer;
  }

  img,
  .message,
  .info {
    pointer-events: none;
    user-select: none;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    position: relative;
    top: -20px;
  }

  .message {
    position: absolute;
    font-size: 20px;
    font-weight: bold;
    text-shadow: 1px 1px 1px #777;
    left: 0;
    bottom: 34px;
    color: #fff;
    right: 0;
    text-align: center;
    user-select: none;
  }

  .info {
    position: absolute;
    font-size: 11px;
    font-weight: bold;
    right: 23px;
    bottom: 10px;
    color: #b0afaf;
  }
</style>
