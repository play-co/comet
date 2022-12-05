<script lang="ts">
  export let label: string;
</script>

<property-control-pair>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="label">{label}:</label>
  <div class="controls">
    <slot name="prop1" />
    <slot name="prop2" />
  </div>
</property-control-pair>

<style>
  property-control-pair {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  label {
    text-align: right;
    font-size: 10px;
    margin-left: 5px;
    text-transform: uppercase;
    color: #a2a2a2;
  }

  .controls {
    display: flex;
    flex-direction: row;
  }
</style>
