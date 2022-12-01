<script lang="ts">
  import type { PropertyBinding } from "../../propertiesPanel";

  export let property: PropertyBinding;
  export let id: string;

  function getValue() {
    try {
      const { nodes } = property;
      if (nodes.length === 1) {
        return format(nodes[0].model.getValue(property.key));
      } else {
        return "<mixed>";
      }
    } catch (e) {
      return "ERROR";
    }
  }

  let value: string;

  $: (value = getValue()), property;

  function format(num: number) {
    return num.toFixed(2).replace(/\.00$/, "");
  }
</script>

<numeric-control>
  {id}
  <input type="text" {value} />
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
