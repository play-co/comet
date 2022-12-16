<script lang="ts" context="module">
  export type FocusAreaId = "project" | "hierarchy" | "viewport" | "properties";
</script>

<script lang="ts">
  import { Application } from "../../../core/application";
  import Events from "../../../events";

  export let id: FocusAreaId;

  let isFocussed = false;

  const app = Application.instance;

  Events.focus.focus.bind((focusId) => {
    isFocussed = id === focusId;
  });

  const onFocus = () => app.setFocusArea(id);
</script>

<focus-area class:focussed={isFocussed} on:focus={onFocus} on:mousedown={onFocus} tabindex="0">
  <slot />
</focus-area>

<style>
  focus-area {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    border: 1px solid transparent;
    border-radius: 2px;
    transition: 0.1s border-color ease-in-out;
  }

  focus-area.focussed {
    border: 1px solid #396a95;
  }

  focus-area:focus {
    outline: none;
  }
</style>
