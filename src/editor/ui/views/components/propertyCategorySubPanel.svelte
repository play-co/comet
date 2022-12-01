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
    background: #ffffff08;
    border-radius: 10px;
  }

  fieldset {
    border: 1px outset #666;
    margin: 5px;
    padding: 5px;
  }

  legend {
    font-size: 12px;
    font-weight: bold;
    padding: 0 5px;
    background-color: #0000001f;
    border-radius: 5px;
    border-bottom: 1px solid #5c5a5a;
    border-top: 1px solid #121212;
  }
</style>
