<script lang="ts">
  import { getGlobalEmitter } from "../../../../../core/events";
  import type { ModifyModelCommandParams } from "../../../../commands/modifyModel";
  import { ModifyModelsCommand } from "../../../../commands/modifyModels";
  import { Application } from "../../../../core/application";
  import type { DatastoreEvent } from "../../../../events/datastoreEvents";
  import type { EditorEvent } from "../../../../events/editorEvents";
  import type { PropertyBinding } from "../../propertiesPanel";
  import {
    isNumericInput,
    isDeleteKey,
    isAcceptKey,
    isArrowKey,
    isIncrementKey,
    isDecrementKey,
  } from "../../../components/filters";
  import { isKeyPressed } from "../../../components/keyboardListener";
  import { Actions } from "../../../../actions";

  export let property: PropertyBinding;

  const datastoreEmitter = getGlobalEmitter<DatastoreEvent>();
  const editorEmitter = getGlobalEmitter<EditorEvent>();

  export const smallInc = 1;
  export const largeInc = 10;
  const mixedToken = "mixed";

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
          return mixedToken;
        }
      }
    } catch (e) {
      return "ERROR";
    }
  }

  let value: string;
  let prevValue: string;

  $: (value = getValue()), property;

  function format(value: number) {
    return value.toFixed(1).replace(/\.0+$/, "");
  }

  function setValue(value: number) {
    const modifications: ModifyModelCommandParams<any>[] = [];

    property.nodes.forEach((node) => {
      const values: any = {};

      values[property.key] = value;

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

  const onUpdate = () => {
    value = getValue();
  };

  const onFocus = (e: Event) => {
    const element = e.target as HTMLInputElement;
    prevValue = element.value;
    console.log(prevValue);
  };

  const onChange = (e: Event) => {
    const element = e.target as HTMLInputElement;
    const number = parseFloat(element.value);

    if (isNaN(number)) {
      element.value = prevValue;
    } else {
      setValue(number);
    }

    element.blur();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const { key } = e;
    const element = e.target as HTMLInputElement;
    const value = parseFloat(element.value);
    const isMinusKeyAtNonZeroIndex =
      key === "-" && element.selectionStart !== 0;
    const isValidKey =
      isNumericInput(key) ||
      isDeleteKey(key) ||
      isAcceptKey(key) ||
      isArrowKey(key);

    if (key === "z" && isKeyPressed("Control")) {
      if (isKeyPressed("Shift")) {
        Actions.redo.dispatch();
      } else {
        Actions.undo.dispatch();
      }
      return true;
    } else if (isIncrementKey(key)) {
      if (!isNaN(value)) {
        setValue(value + (isKeyPressed("Shift") ? largeInc : smallInc));
      }
    } else if (isDecrementKey(key)) {
      if (!isNaN(value)) {
        setValue(value - (isKeyPressed("Shift") ? largeInc : smallInc));
      }
    } else if (key == "Escape") {
      element.blur();
      return true;
    } else if (isValidKey && !isMinusKeyAtNonZeroIndex) {
      return true;
    }

    e.preventDefault();
    return false;
  };

  datastoreEmitter.on("datastore.local.node.modified", onUpdate);
</script>

<numeric-control>
  <input
    type="text"
    class={value === mixedToken ? "mixed" : "normal"}
    {value}
    on:focus={onFocus}
    on:keydown={onKeyDown}
    on:change={onChange} />
</numeric-control>

<style>
  numeric-control {
    display: inline-block;
    max-width: 50px;
  }

  input {
    width: 100%;
    border: 1px solid #4f4f4f;
    background-color: #323030;
    font-size: 12px;
    padding: 3px 5px;
    margin-bottom: 5px;
    border-radius: 3px;
  }

  input.mixed {
    color: #777;
    font-style: italic;
    text-align: center;
  }
</style>
