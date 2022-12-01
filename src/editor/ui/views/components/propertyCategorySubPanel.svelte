<script lang="ts">
  export let title: string;
</script>

<property-panel>
  <fieldset>
    <legend>{title}</legend>
    <slot />
  </fieldset>
</property-panel>

<style>
  fieldset {
    border: 1px outset #666;
    margin: 5px;
    padding: 5px;
  }

  legend {
    font-size: 14px;
    font-weight: bold;
    padding: 0 5px;
  }
</style>
