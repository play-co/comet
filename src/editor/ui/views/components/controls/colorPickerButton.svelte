<script lang="ts">
  import Color from "color";
  import ColorPickerDialog from "./colorPickerDialog.svelte";

  export let color: string;

  let isOpened = false;
</script>

<div>
  <button
    on:click={() => (isOpened = true)}
    style={`background:${color};border-color:${Color(color).lighten(0.5)}`} />
  {#if isOpened}
    <ColorPickerDialog
      {color}
      on:change={(e) => {
        color = e.detail;
      }}
      on:close={() => (isOpened = false)}
      on:change
      on:close />
  {/if}
</div>

<style>
  button {
    width: 30px;
    height: 20px;
    border: 1px outset #333;
  }

  button:hover {
    border: 1px inset #333;
  }

  button:focus {
    border: 2px inset #333;
  }
</style>
