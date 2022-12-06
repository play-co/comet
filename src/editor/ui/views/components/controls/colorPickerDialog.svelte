<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import "toolcool-color-picker";
  import type ColorPicker from "toolcool-color-picker";
  import { getGlobalEmitter } from "../../../../../core/events";
  import type { GlobalKeyboardEvent } from "../../../../events/keyboardEvents";
  import { mouseDrag } from "../../../components/dragger";

  export let color: string;
  // export declare function createEventDispatcher<EventMap extends {} = any>()
  //  : <EventKey extends Extract<keyof EventMap, string>>(type: EventKey, detail?: EventMap[EventKey]) => void;

  const dispatch = createEventDispatcher();

  let left: number = 100;
  let top: number = 100;
  let picker: ColorPicker;
  let titleBar: HTMLDivElement;
  let colorBox: HTMLButtonElement;
  let lastColor = color;

  const keyboardEmitter = getGlobalEmitter<GlobalKeyboardEvent>();

  function init() {
    if (!picker) {
      setTimeout(init, 10);
    }

    picker.color = color;

    onChange();

    titleBar.addEventListener("mousedown", onMouseDown);
    picker.addEventListener("change", onChange);
    keyboardEmitter.on("key.down", onKeyDown);
  }

  function close() {
    titleBar.removeEventListener("mousedown", onMouseDown);
    titleBar.removeEventListener("change", onChange);
    keyboardEmitter.off("key.down", onKeyDown);
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
    }
  };

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
</script>

<color-picker-dialog style={`left:${left}px;top:${top}px`}>
  <div bind:this={titleBar} class="titlebar" />
  <div class="picker">
    <toolcool-color-picker
      bind:this={picker}
      color="#e76ff1"
      button-padding="1px" />
  </div>
  <button bind:this={colorBox} class="color">&nbsp;</button>
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
</style>
