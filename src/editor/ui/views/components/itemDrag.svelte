<script lang="ts">
  import Events from "../../../events";

  let isDragging = false;

  Events.itemDrag.startDrag.bind(() => {
    isDragging = true;
    document.body.classList.add("isDragging");
  });

  Events.itemDrag.endDrag.bind(() => {
    isDragging = false;
    document.body.classList.remove("isDragging");
  });
</script>

<item-drag class:isDragging />

<style>
  item-drag {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
