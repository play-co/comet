<script lang="ts">
  import { getGlobalEmitter } from "../../../../../core/events";
  import type { DatastoreEvent } from "../../../../events/datastoreEvents";
  import type { PropertyBinding } from "../../propertiesPanel";

  export let property: PropertyBinding;

  const datastoreEmitter = getGlobalEmitter<DatastoreEvent>();

  function getValue() {
    try {
      const { nodes } = property;
      if (nodes.length === 1) {
        return format(nodes[0].model.getValue(property.key));
      } else {
        let values = new Set();
        nodes.forEach((node) => values.add(node.model.getValue(property.key)));
        if (values.size === 1) {
          const [firstValue] = values;
          return String(firstValue);
        } else {
          return "#mixed";
        }
      }
    } catch (e) {
      return "ERROR";
    }
  }

  let value: string;

  $: (value = getValue()), property;

  function format(num: number) {
    return num.toFixed(1).replace(/\.00$/, "");
  }

  datastoreEmitter.on("datastore.local.node.modified", () => {
    value = getValue();
  });
</script>

<numeric-control>
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
