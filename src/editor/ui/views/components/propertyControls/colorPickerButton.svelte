<script lang="ts">
  import Color from "color";

  import { nextTick } from "../../../../../core/util";
  import { getApp } from "../../../../core/application";
  import Events from "../../../../events";
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

  Events.key.down.bind((e) => {
    if (e.key === "Escape" && isOpened) {
      isOpened = false;
    }
  });
</script>

<color-picker-button>
  <button
    bind:this={button}
    on:click={onClick}
    style={`background:${color};border-color:${Color(color).alpha(1).lighten(0.5)}`}
  />
  <span class="debug">{Color(color).rgbNumber()}</span>
  {#if isOpened}
    <ColorPickerDialog
      mode={getApp().colorPickerMode}
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
    position: relative;
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

  .debug {
    position: absolute;
    left: 37px;
    top: 0;
    font-size: 11px;
    color: #959595;
  }
</style>
