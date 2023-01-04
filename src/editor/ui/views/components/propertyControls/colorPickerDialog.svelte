<script lang="ts">
  import ColorPicker from "svelte-awesome-color-picker";
  import { createEventDispatcher, onMount } from "svelte";

  import { mouseDrag } from "../../../components/dragger";
  import Events from "../../../../events";
  import { saveUserEditPrefs } from "../../../../core/userPrefs";
  import { getApp } from "../../../../core/application";
  import { nextTick } from "../../../../../core/util";

  type ColorPickerMode = "hex" | "rgb" | "hsv";

  export let color: string;
  export let mode: ColorPickerMode = "rgb";

  const dispatch = createEventDispatcher();

  let picker: HTMLElement;
  let isEditing = false;
  let left: number = 100;
  let top: number = 100;

  let titleBar: HTMLDivElement;

  function open() {}

  function close() {
    dispatch("close");
  }

  onMount(() => {
    titleBar.addEventListener("mousedown", onTitleBarMouseDown);

    const wrapper = picker.querySelector(".wrapper") as HTMLElement;
    const colorBox = wrapper.querySelector(".picker") as HTMLElement;
    const colorSlider = wrapper.querySelector(".slider") as HTMLElement;
    const alphaSlider = wrapper.querySelector(".alpha") as HTMLElement;
    const button = wrapper.querySelector("button") as HTMLButtonElement;

    const beginEditing = () => (isEditing = true);

    colorBox.onmousedown = beginEditing;
    colorSlider.onmousedown = beginEditing;
    alphaSlider.onmousedown = beginEditing;

    // listen to button change events
    button.onmouseup = () => {
      // allow ui to update
      nextTick().then(() => {
        mode = button.innerText.toLowerCase() as ColorPickerMode;
        getApp().colorPickerMode = mode;
        saveUserEditPrefs();
      });
    };

    // force the view to change to the desired mode
    if (mode === "rgb") {
      button.click();
    } else if (mode === "hsv") {
      button.click();
      button.click();
    }

    // catch mouseup outside of dialog
    Events.mouse.up.bind(() => {
      if (isEditing) {
        dispatch("accept", color);
      }
      isEditing = false;
    });
    open();
  });

  const onChange = (event: CustomEvent) => {
    color = event.detail.hex;
    dispatch("change", color);
  };

  const onTitleBarMouseDown = (event: MouseEvent) => {
    event.stopPropagation();

    mouseDrag(
      {
        startX: left,
        startY: top,
        event,
      },
      ({ currentX, currentY }) => {
        left = currentX;
        top = currentY;
      }
    );
  };

  const onCloseClick = (e: MouseEvent) => {
    e.stopPropagation();
    close();
  };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<color-picker-dialog style={`left:${left}px;top:${top}px`}>
  <div bind:this={titleBar} class="titlebar">
    <button class="close" on:click={onCloseClick}>x</button>
  </div>
  <div class="picker" bind:this={picker}>
    <ColorPicker hex={color} isOpen={true} isInput={false} isPopup={false} on:input={onChange} />
  </div>
</color-picker-dialog>

<style>
  color-picker-dialog {
    position: fixed;
    display: flex;
    flex-direction: column;
    box-shadow: 3px 7px 13px #00000082;
    z-index: 100;
  }

  .titlebar {
    height: 20px;
    background-color: #525252;
    cursor: move;
    border: 1px outset #888;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .close {
    width: 20px;
    height: 20px;
    background-color: #6d6d6d;
    border: 1px outset #878585;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    cursor: pointer;
    padding-bottom: 3px;
    padding-left: 1px;
  }

  .close:hover {
    background-color: #363636;
  }

  .picker {
    overflow: hidden;
    border: 1px outset #888;
  }

  .picker :global(.wrapper) {
    margin: 0;
    background-color: #424242;
    border-radius: 0;
    border: none;
  }

  .picker :global(input),
  .picker :global(button) {
    color: #c0c0c0;
    background-color: #323030;
  }
</style>
