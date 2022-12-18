<script lang="ts" context="module">
  import type { ComponentType } from "svelte";
  import { scale } from "svelte/transition";
  import Events from "../../../events";
  import Splash from "../dialog/splash.svelte";

  export type ModalDialogId = "splash";

  const modalDialogs: Record<ModalDialogId, ComponentType> = {
    splash: Splash,
  };
</script>

<script lang="ts">
  $: open = null as ModalDialogId | null;

  Events.dialog.modal.open.bind((id: ModalDialogId) => {
    open = id;
  });

  Events.dialog.modal.close.bind(() => {
    open = null;
  });
</script>

<modal-dialogs class:open>
  {#if open}
    <div class="overlay" transition:scale={{ duration: 250 }}>
      <svelte:component this={modalDialogs[open]} />
    </div>
  {/if}
</modal-dialogs>

<style>
  modal-dialogs {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    pointer-events: none;
  }

  modal-dialogs.open {
    pointer-events: all;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
