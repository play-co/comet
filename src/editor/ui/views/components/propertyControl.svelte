<script lang="ts">
  export let label: string;
  export let align: "left" | "right" = "right";
</script>

<property-control class={align}>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label>{label}</label>
  <slot />
</property-control>

<style>
  property-control {
    display: flex;
  }

  label {
    background-color: red;
  }

  .left,
  .right {
    flex-direction: row;
  }

  .right {
    flex-direction: row-reverse;
  }
</style>
