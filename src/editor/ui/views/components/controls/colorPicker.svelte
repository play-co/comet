<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import "toolcool-color-picker";
  import type ColorPicker from "toolcool-color-picker";
  import { mouseDrag } from "../../../components/dragger";

  let left: number = 100;
  let top: number = 100;
  let picker: ColorPicker;
  let titleBar: HTMLDivElement;
  let colorBox: any;

  const onMouseDown = (e: MouseEvent) => {
    const startLeft = left;
    const startTop = top;

    e.stopPropagation();

    mouseDrag(e, (deltaX, deltaY) => {
      left = startLeft + deltaX;
      top = startTop + deltaY;
    });
  };

  onMount(() => {
    picker.onchange = () => {
      colorBox.style.background = picker.hex8;
    };

    colorBox.style.background = picker.hex8;

    titleBar.addEventListener("mousedown", onMouseDown);

    setTimeout(() => {
      //   picker.opened = true;
    }, 0);

    setInterval(() => {
      if (picker && !picker.opened) {
        picker.opened = true;
      }
    }, 10);
  });

  onDestroy(() => {
    titleBar.removeEventListener("mousedown", onMouseDown);
  });
</script>

<color-picker style={`left:${left}px;top:${top}px`}>
  <div bind:this={titleBar} class="titlebar" />
  <div class="picker">
    <toolcool-color-picker
      bind:this={picker}
      color="#e76ff1"
      button-padding="1px" />
  </div>
  <div bind:this={colorBox} class="color" />
</color-picker>

<style>
  color-picker {
    position: fixed;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 6px 16px #00000052;
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
    background-color: red;
    border: 1px outset #888;
  }

  toolcool-color-picker {
    position: relative;
    top: -29px;
    left: -2px;
  }
</style>
