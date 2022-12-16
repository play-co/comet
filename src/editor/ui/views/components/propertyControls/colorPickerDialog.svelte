<script lang="ts">
  import { Rectangle } from "pixi.js";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import "toolcool-color-picker";
  import type ColorPicker from "toolcool-color-picker";
  import { getApp } from "../../../../core/application";
  import Events from "../../../../events";
  import { mouseDrag } from "../../../components/dragger";
  import { isAcceptKey, isArrowKey, isDeleteKey, isNumeric } from "../../../components/filters";

  export let color: string;

  const app = getApp();
  const dispatch = createEventDispatcher();

  let left: number = 100;
  let top: number = 100;
  let picker: ColorPicker;
  let titleBar: HTMLDivElement;
  let colorBox: HTMLButtonElement;
  let mouseArea: HTMLDivElement;
  let lastColor = color;
  let hasAccepted = false;

  onMount(() => {
    // keep 3rd party component open
    setInterval(() => {
      if (picker && !picker.opened) {
        picker.color = color;
        picker.opened = true;
        colorBox.style.background = color;
      }
    }, 10);

    open();
  });

  onDestroy(close);

  function open() {
    if (!picker) {
      // shadow-dom of 3rd party lib is not immediately available, short poll until its available
      setTimeout(open, 10);
      return;
    }

    app.isColorPickerOpen = true;

    // bind to events
    window.addEventListener("mouseup", onMouseUp);
    titleBar.addEventListener("mousedown", onMouseDown);
    picker.addEventListener("change", onChange);
    Events.key.down.bind(onKeyDown);
  }

  function close() {
    app.isColorPickerOpen = false;

    // unbind to events
    window.removeEventListener("mouseup", onMouseUp);
    titleBar.removeEventListener("mousedown", onMouseDown);
    picker.removeEventListener("change", onChange);
    Events.key.down.unbind(onKeyDown);

    if (!hasAccepted) {
      accept(picker.hex8);
    }

    dispatch("close");
  }

  function accept(color: string) {
    dispatch("accept", color);
    hasAccepted = true;
  }

  const onMouseDown = (event: MouseEvent) => {
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

  const onMouseUp = (e: MouseEvent) => {
    const bounds = mouseArea.getBoundingClientRect();
    const { clientX, clientY } = e;
    const rect = new Rectangle(bounds.left, bounds.top, bounds.width, bounds.height);

    if (rect.contains(clientX, clientY)) {
      // accept(picker.hex8);
    }
  };

  const onChange = () => {
    const color = picker.hex8;

    if (color === lastColor) {
      return;
    }

    colorBox.style.background = color;
    lastColor = color;

    dispatch("change", color);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    } else if (isDeleteKey(e.key)) {
      e.stopPropagation();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const { key } = e;
    const isValidKey = isNumeric(key) || isAcceptKey(key) || isArrowKey(key);

    if (!isValidKey) {
      return;
    }

    accept(picker.hex8);
    close();
  };

  const onCloseClick = (e: MouseEvent) => {
    e.stopPropagation();
    close();
  };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<color-picker-dialog style={`left:${left}px;top:${top}px`} on:keydown={onKeyUp}>
  <div bind:this={titleBar} class="titlebar">
    <button class="close" on:click={onCloseClick}>x</button>
  </div>
  <div class="picker">
    <toolcool-color-picker bind:this={picker} color="#e76ff1" button-padding="1px" />
  </div>
  <button bind:this={colorBox} class="color" on:mousedown={(e) => e.stopPropagation()}
    >&nbsp;</button
  >
  <div bind:this={mouseArea} class="mousearea" />
</color-picker-dialog>

<style>
  color-picker-dialog {
    position: fixed;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 5px 9px #00000082;
    z-index: 100;
  }

  .titlebar {
    height: 20px;
    background-color: #333;
    cursor: move;
    border: 1px outset #888;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .close {
    width: 20px;
    height: 20px;
    background-color: #242424;
    border: 1px outset #878585;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9a9a9a;
    font-family: sans-serif;
    cursor: pointer;
  }

  .close:hover {
    background-color: #363636;
  }

  .picker {
    width: 228px;
    height: 248px;
    overflow: hidden;
    border: 1px outset #888;
  }

  .color {
    height: 50px;
    border: 1px outset #888;
  }

  toolcool-color-picker {
    position: relative;
    top: -29px;
    left: -2px;
  }

  .mousearea {
    position: absolute;
    z-index: 100;
    opacity: 0.5;
    top: 29px;
    left: 8px;
    width: 214px;
    height: 172px;
    pointer-events: none;
  }
</style>
