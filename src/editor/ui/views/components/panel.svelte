<script lang="ts">
</script>

<panel-container>
  <slot />
</panel-container>

<style>
  panel-container {
    background-color: var(--panel-bg-color);
    display: block;
    width: 100%;
    height: 100%;
    border: var(--panel-border-size) solid var(--app-bg-color);
    border-radius: 5px;
  }
</style>
