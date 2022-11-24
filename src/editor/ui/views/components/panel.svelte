<script lang="ts">
</script>

<panel-container>
  <slot />
</panel-container>

<style>
  panel-container {
    background-color: var(--panel-bg-color-light);
    display: block;
    width: 100%;
    height: 100%;
    padding: 10px;
  }
</style>
