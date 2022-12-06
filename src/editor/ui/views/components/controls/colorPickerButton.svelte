<script lang="ts">
  import Color from "color";
  import ColorPickerDialog from "./colorPickerDialog.svelte";

  export let color: string;

  let isOpened = false;
  let button: HTMLButtonElement;

  const onClick = () => {
    isOpened = !isOpened;
    if (!isOpened) {
      button.blur();
    }
  };
</script>

<div>
  <button
    bind:this={button}
    on:click={onClick}
    style={`background:${color};border-color:${Color(color).lighten(0.5)}`} />
  {#if isOpened}
    <ColorPickerDialog
      {color}
      on:change={(e) => {
        color = e.detail;
      }}
      on:close={() => (isOpened = false)}
      on:change
      on:accept
      on:close />
  {/if}
</div>

<style>
  button {
    width: 30px;
    height: 20px;
    border: 1px outset #333;
    cursor: pointer;
  }

  button:hover {
    border: 1px inset #333;
  }

  button:focus {
    border: 2px inset #333;
  }
</style>
