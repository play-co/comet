<script lang="ts">
  import Events from "../../../events";

  const onClick = () => {
    Events.dialog.modal.close.emit();
  };
</script>

<div on:click={onClick}>Splash!</div>

<style>
  div {
    width: 500px;
    height: 500px;
    background-color: red;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
