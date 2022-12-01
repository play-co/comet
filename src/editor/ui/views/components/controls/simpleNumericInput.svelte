<script lang="ts">
  export let value: number;

  function format(num: number) {
    return num.toFixed(2).replace(/\.00$/, "");
  }
</script>

<numeric-control>
  <input type="text" value={format(value)} />
</numeric-control>

<style>
  numeric-control {
    display: inline-block;
  }

  input {
    width: 100%;
    border: 1px solid #4f4f4f;
    background-color: #323030;
    font-size: 12px;
    padding: 5px;
    margin-bottom: 5px;
    border-radius: 3px;
  }
</style>
