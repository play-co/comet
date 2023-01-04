<script lang="ts">
  import Color from "color";
  import { nextTick } from "../../../../../core/util";
  import ColorPickerDialog from "./colorPickerDialog.svelte";

  export let color: string;

  let dialog: ColorPickerDialog;
  let isOpened = false;
  let button: HTMLButtonElement;

  export function reload(newColor: string) {
    color = newColor;
    dialog.setColor(newColor);
    isOpened = false;

    nextTick().then(() => {
      isOpened = true;
    });
  }

  export function isOpen() {
    return isOpened;
  }

  const onClick = () => {
    isOpened = !isOpened;

    if (!isOpened) {
      button.blur();
    }
  };
</script>

<color-picker-button>
  <button
    bind:this={button}
    on:click={onClick}
    style={`background:${color};border-color:${Color(color).lighten(0.5)}`}
  />
  {#if isOpened}
    <ColorPickerDialog
      bind:this={dialog}
      {color}
      on:change={(e) => {
        color = e.detail;
      }}
      on:close={() => (isOpened = false)}
      on:change
      on:accept
      on:close
    />
  {/if}
</color-picker-button>

<style>
  color-picker-button {
    width: 100%;
    height: 100%;
    display: flex;
    border-radius: 5px;
    margin: 0 1px;
  }

  button {
    border: 1px outset #333;
    cursor: pointer;
    flex-grow: 1;
    border-radius: 5px;
  }

  button:hover {
    border: 1px inset #333;
  }

  button:focus {
    border: 2px inset #333;
  }
</style>
