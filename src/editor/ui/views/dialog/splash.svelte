<script lang="ts">
  import Events from "../../../events";
  let message = "Connecting...";
  let isReady = false;

  const onClick = () => {
    Events.dialog.modal.close.emit();
  };

  Events.project.open.attempt.bind(() => {
    message = "Opening project...";
  });

  Events.project.ready.bind(() => {
    message = "Let's go!";
    isReady = true;
    setTimeout(() => {
      Events.dialog.modal.close.emit();
    }, 250);
  });
</script>

<dialog-splash on:click={onClick} on:click={onClick} class:isReady>
  <img src="/assets/logo.png" alt="Comet" />
  <div class="message">{message}</div>
</dialog-splash>

<style>
  dialog-splash {
    width: 500px;
    height: 500px;
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

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .message {
    position: absolute;
    font-size: 20px;
    font-weight: bold;
    text-shadow: 1px 1px 1px #777;
    right: 10px;
    bottom: 10px;
    color: #fff;
  }
</style>
