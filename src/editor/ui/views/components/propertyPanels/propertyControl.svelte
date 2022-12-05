<script lang="ts">
  export let label: string;
  export let align: "left" | "right" = "left";
</script>

<property-control class={`align-${align}`}>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label class="label">{label}:</label>
  <span class="spacer" />
  <slot />
</property-control>

<style>
  property-control {
    display: flex;
  }

  label {
    min-width: 25px;
    text-align: right;
    font-size: 14px;
  }

  .spacer {
    display: inline-block;
    width: 10px;
    height: 10px;
  }

  .align-left,
  .align-right {
    flex-direction: row;
  }

  .align-right {
    flex-direction: row-reverse;
  }

  .label:global(.align-left) {
    background-color: red;
  }
</style>
