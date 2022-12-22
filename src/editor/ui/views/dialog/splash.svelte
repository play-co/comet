<script lang="ts">
  import Events from "../../../events";

  const onClick = () => {
    Events.dialog.modal.close.emit();
  };
</script>

<dialog-splash on:click={onClick}>
  <img src="/assets/logo.png" alt="Comet" />
  <div class="message">Connecting...</div>
</dialog-splash>

<style>
  dialog-splash {
    width: 500px;
    height: 500px;
    background-color: #d4d4d4;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    border: 5px outset #fff;
    box-shadow: 7px 13px 20px #000;
    cursor: wait;
    position: relative;
    border-radius: 10px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: rotate(170deg);
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
