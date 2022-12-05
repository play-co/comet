<script lang="ts">
  import { getGlobalEmitter } from "../../../../../core/events";
  import type { ModifyModelCommandParams } from "../../../../commands/modifyModel";
  import { ModifyModelsCommand } from "../../../../commands/modifyModels";
  import { Application } from "../../../../core/application";
  import type { DatastoreEvent } from "../../../../events/datastoreEvents";
  import type { EditorEvent } from "../../../../events/editorEvents";
  import type { PropertyBinding } from "../../propertiesPanel";

  export let property: PropertyBinding;

  const datastoreEmitter = getGlobalEmitter<DatastoreEvent>();
  const editorEmitter = getGlobalEmitter<EditorEvent>();

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
    return num.toFixed(1).replace(/\.0+$/, "");
  }

  const onUpdate = () => {
    value = getValue();
  };

  const onChange = (e: Event) => {
    const element = e.target as HTMLInputElement;
    const number = parseFloat(element.value);

    if (!isNaN(number)) {
      const modifications: ModifyModelCommandParams<any>[] = [];

      property.nodes.forEach((node) => {
        const values: any = {};

        values[property.key] = number;

        modifications.push({
          nodeId: node.id,
          values,
          updateMode: "full",
        });
      });

      Application.instance.undoStack.exec(
        new ModifyModelsCommand({ modifications })
      );

      editorEmitter.emit("editor.property.modified", property);
    }
    element.blur();
  };

  datastoreEmitter.on("datastore.local.node.modified", onUpdate);
</script>

<numeric-control>
  <input type="text" {value} on:change={onChange} />
</numeric-control>

<style>
  numeric-control {
    display: inline-block;
    max-width: 55px;
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
