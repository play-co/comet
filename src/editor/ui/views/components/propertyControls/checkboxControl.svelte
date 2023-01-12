<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let checked: boolean;

  const dispatch = createEventDispatcher();

  let value: boolean = checked;
  let isDown = false;

  const onMouseDown = () => {
    isDown = true;
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseUp = () => {
    isDown = false;
    value = !value;
    dispatch("change", value);
    window.removeEventListener("mouseup", onMouseUp);
  };
</script>

<checkbox-control
  class={`${isDown ? "down" : "up"} ${value ? "checked" : "unchecked"}`}
  tabindex="0"
  on:mousedown={onMouseDown}
>
  <div class="state">
    {#if value || isDown}
      <span>x</span>
    {/if}
  </div>
</checkbox-control>

<style>
  checkbox-control {
    width: 16px;
    height: 16px;
    display: flex;
    border-radius: 3px;
    padding: 8px;
    background-color: #666;
    border: 1px outset #777;
    color: white;
    cursor: pointer;
  }

  checkbox-control:hover {
    border-color: #ccc !important;
  }

  checkbox-control.down,
  checkbox-control.checked {
    background-color: #444;
    border: 1px inset #727272;
  }

  .state {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    font-weight: bold;
    font-size: 12px;
    border-radius: 3px;
  }
</style>
