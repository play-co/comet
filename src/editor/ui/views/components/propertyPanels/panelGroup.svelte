<script lang="ts">
  export let title: string;
</script>

<panel-group>
  <fieldset>
    <legend>{title}</legend>
    <slot />
  </fieldset>
</panel-group>

<style>
  panel-group {
    display: grid;
    grid-template-columns: 1fr;
    border-radius: 10px;
  }

  fieldset {
    border: 1px outset #666a;
    padding: 10px;
    padding-right: 15px;
    border-radius: 2px;
    background: #ffffff08;
    border-left: none;
    border-right: none;
    display: flex;
    flex-direction: column;
  }

  legend {
    font-size: 12px;
    font-weight: bold;
    padding: 0 5px;
    border-radius: 5px;
  }
</style>
