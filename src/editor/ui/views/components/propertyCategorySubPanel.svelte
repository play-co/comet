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
  property-panel {
    display: flex;
    flex-direction: column;
    border-radius: 10px;
  }

  fieldset {
    border: 1px outset #666;
    padding: 10px;
    border-radius: 2px;
    background: #ffffff08;
    border-left: none;
    border-right: none;
  }

  legend {
    font-size: 12px;
    font-weight: bold;
    padding: 0 5px;
    border-radius: 5px;
  }
</style>
