<script lang="ts">
  import { Rectangle } from "pixi.js";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import "toolcool-color-picker";
  import type ColorPicker from "toolcool-color-picker";
  import { getGlobalEmitter } from "../../../../../core/events";
  import { Actions } from "../../../../actions";
  import type { GlobalKeyboardEvent } from "../../../../events/keyboardEvents";
  import { mouseDrag } from "../../../components/dragger";
  import {
    isAcceptKey,
    isArrowKey,
    isDeleteKey,
    isNumeric,
  } from "../../../components/filters";

  export let color: string;
  // export declare function createEventDispatcher<EventMap extends {} = any>()
  //  : <EventKey extends Extract<keyof EventMap, string>>(type: EventKey, detail?: EventMap[EventKey]) => void;

  const dispatch = createEventDispatcher();

  let left: number = 100;
  let top: number = 100;
  let picker: ColorPicker;
  let titleBar: HTMLDivElement;
  let colorBox: HTMLButtonElement;
  let mouseArea: HTMLDivElement;
  let lastColor = color;

  const keyboardEmitter = getGlobalEmitter<GlobalKeyboardEvent>();

  onMount(() => {
    // keep 3rd party component open
    setInterval(() => {
      if (picker && !picker.opened) {
        picker.opened = true;
      }
    }, 10);

    init();
  });

  onDestroy(close);

  function init() {
    if (!picker) {
      // shadow-dom of 3rd party lib is not immediately available, poll until
      setTimeout(init, 10);
      return;
    }

    picker.color = color;

    onChange();

    // bind to events
    titleBar.addEventListener("mousedown", onMouseDown);
    picker.addEventListener("change", onChange);
    keyboardEmitter.on("key.down", onKeyDown);
    window.addEventListener("mouseup", onMouseUp);
  }

  function close() {
    // unbind to events
    titleBar.removeEventListener("mousedown", onMouseDown);
    titleBar.removeEventListener("change", onChange);
    keyboardEmitter.off("key.down", onKeyDown);
    window.removeEventListener("mouseup", onMouseUp);
  }

  const onMouseDown = (e: MouseEvent) => {
    const startLeft = left;
    const startTop = top;

    e.stopPropagation();

    mouseDrag(e, (deltaX, deltaY) => {
      left = startLeft + deltaX;
      top = startTop + deltaY;
    });
  };

  const onMouseUp = (e: MouseEvent) => {
    const bounds = mouseArea.getBoundingClientRect();
    const { clientX, clientY } = e;
    const rect = new Rectangle(
      bounds.left,
      bounds.top,
      bounds.width,
      bounds.height
    );

    if (rect.contains(clientX, clientY)) {
      dispatch("accept", picker.hex8);
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
      dispatch("close");
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

    dispatch("accept", picker.hex8);
  };

  const onMouseOver = () => {
    // temp disable deleteNode action to allow deleting rgb inputs
    Actions.deleteNode.isEnabled = false;
  };

  const onMouseOut = () => {
    // restore deleteNode action
    Actions.deleteNode.isEnabled = true;
  };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<color-picker-dialog
  style={`left:${left}px;top:${top}px`}
  on:keydown={onKeyUp}
  on:mouseover={onMouseOver}
  on:mouseout={onMouseOut}>
  <div bind:this={titleBar} class="titlebar" />
  <div class="picker">
    <toolcool-color-picker
      bind:this={picker}
      color="#e76ff1"
      button-padding="1px" />
  </div>
  <button
    bind:this={colorBox}
    class="color"
    on:mousedown={(e) => e.stopPropagation()}>&nbsp;</button>
  <div bind:this={mouseArea} class="mousearea" />
</color-picker-dialog>

<style>
  color-picker-dialog {
    position: fixed;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 6px 16px #00000052;
    z-index: 1000;
  }

  .titlebar {
    height: 20px;
    background-color: #444;
    cursor: move;
    border: 1px outset #888;
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
