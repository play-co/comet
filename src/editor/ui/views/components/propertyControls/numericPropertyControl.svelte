<script lang="ts">
  import type { ModifyModelCommandParams } from "../../../../commands/modifyModel";
  import { ModifyModelsCommand } from "../../../../commands/modifyModels";
  import { Application } from "../../../../core/application";
  import type { PropertyBinding } from "../../propertiesPanel";
  import {
    isNumericInput,
    isDeleteKey,
    isAcceptKey,
    isArrowKey,
  } from "../../../components/filters";
  import { isKeyPressed } from "../../../components/keyboardListener";
  import { Actions } from "../../../../actions";
  import type { DisplayObjectNode } from "../../../../../core/nodes/abstract/displayObjectNode";
  import Events from "../../../../events";

  // component props
  export let property: PropertyBinding;
  export let mode: "normal" | "width" | "height" = "normal";

  // const
  const smallInc = 1;
  const largeInc = 10;

  // component view state
  let value: string;
  let mixedValue = false;
  let prevValue: string;
  let timeout: number | undefined = undefined;

  $: (value = getValue()), property;
  $: mixed = mixedValue && value.length === 0;

  // component functions
  function format(value: number) {
    return value.toFixed(1).replace(/\.0+$/, "").replace(/^-0/, "0");
  }

  function getValue() {
    const { nodes } = property;
    const propValue = nodes[0].model.getValue<number>(property.key);

    mixedValue = false;

    if (nodes.length === 1) {
      if (mode === "normal") {
        return format(propValue);
      } else {
        const node = nodes[0].cast<DisplayObjectNode>();
        const nodeValue = mode === "width" ? node.width : node.height;

        return format(propValue * nodeValue);
      }
    } else {
      let values = new Set();

      nodes.forEach((node) => {
        const propValue = node.model.getValue<number>(property.key);
        if (mode === "normal") {
          values.add(propValue);
        } else {
          values.add(
            Math.round(
              mode === "width"
                ? node.cast<DisplayObjectNode>().width * propValue
                : node.cast<DisplayObjectNode>().height * propValue
            )
          );
        }
      });

      if (values.size === 1) {
        const [firstValue] = values;

        return String(firstValue);
      } else {
        mixedValue = true;
        return "";
      }
    }
  }

  function setValue(value: number) {
    const modifications: ModifyModelCommandParams<any>[] = [];

    property.nodes.forEach((node) => {
      const values: any = {};

      if (mode === "normal") {
        values[property.key] = value;
      } else {
        values[property.key] =
          mode === "width"
            ? value / node.cast<DisplayObjectNode>().width
            : value / node.cast<DisplayObjectNode>().height;
      }

      modifications.push({
        nodeId: node.id,
        values,
        updateMode: "full",
      });
    });

    Application.instance.undoStack.exec(new ModifyModelsCommand({ modifications }));

    Events.editor.propertyModified.emit(property);
  }

  function update() {
    value = getValue();
  }

  // handlers
  const onFocus = (e: Event) => {
    const element = e.target as HTMLInputElement;
    prevValue = element.value;

    // select all text
    element.setSelectionRange(0, element.value.length);
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
    const isMinusKeyAtNonZeroIndex = key === "-" && element.selectionStart !== 0;
    let isValidKey =
      isNumericInput(key) ||
      isDeleteKey(key) ||
      isAcceptKey(key) ||
      isArrowKey(key) ||
      key === "Tab";

    mixedValue = element.value.length > 0;

    if (isAcceptKey(key)) {
      if (!isNaN(value)) {
        setValue(value);
      }
    } else if (key === "." && element.value.indexOf(".") > -1) {
      isValidKey = false;
    }

    if (key === "z" && isKeyPressed("Control")) {
      if (isKeyPressed("Shift")) {
        Actions.redo.dispatch();
      } else {
        Actions.undo.dispatch();
      }
      return true;
    } else if (key === "ArrowUp") {
      if (!isNaN(value)) {
        setValue(value + (isKeyPressed("Shift") ? largeInc : smallInc));
      }
    } else if (key === "ArrowDown") {
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

  const onKeyUp = (e: KeyboardEvent) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      const { key } = e;
      const element = e.target as HTMLInputElement;
      const value = parseFloat(element.value);
      const isValidKey = isNumericInput(key) || key === ".";

      if (isValidKey && !isNaN(value)) {
        setValue(value);
      }
    }, 1000) as unknown as number;
  };

  Events.datastore.node.local.modified.bind(update);
</script>

<numeric-control>
  <input
    type="text"
    class:mixed
    placeholder={mixed ? "mixed" : undefined}
    {value}
    on:focus={onFocus}
    on:keydown={onKeyDown}
    on:keyup={onKeyUp}
    on:change={onChange}
  />
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
    border-radius: 3px;
    min-width: 50px;
    box-shadow: inset 3px 3px 2px #04040459;
    padding-top: 6px;
    padding-bottom: 4px;
  }
</style>
