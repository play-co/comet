<script lang="ts" context="module">
  export type FocusAreaId = "project" | "hierarchy" | "viewport" | "properties";
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";

  import { Application } from "../../../core/application";
  import Events from "../../../events";

  export let id: FocusAreaId;
  export let focus: boolean = false;

  const dispatch = createEventDispatcher();

  let container: any;
  let isFocussed = false;

  const app = Application.instance;

  Events.focus.focus.bind((focusId) => {
    isFocussed = id === focusId;
  });

  Events.key.down.bind((e) => {
    if (app.isAreaFocussed(id)) {
      dispatch("keydown", e);
    }
  });

  Events.key.up.bind((e) => {
    if (app.isAreaFocussed(id)) {
      dispatch("keyup", e);
    }
  });

  onMount(() => {
    app.registerFocusArea(id, container);
  });

  const onFocus = () => app.setFocusArea(id);

  if (focus) {
    Events.project.ready.bind(() => {
      onFocus();
      container.focus();
    });
  }

  const onMouseEnter = () => {
    if (app.itemDrag.isDragging) {
      onFocus();
    }
  };
</script>

<focus-area
  bind:this={container}
  class:focussed={isFocussed}
  on:focus={onFocus}
  on:mousedown={onFocus}
  on:mouseenter={onMouseEnter}
  tabindex="0"
>
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
    border: 1px solid #338fa2;
  }

  focus-area:focus {
    outline: none;
  }
</style>
