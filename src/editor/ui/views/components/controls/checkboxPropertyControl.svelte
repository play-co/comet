<script lang="ts">
  import type { ModifyModelCommandParams } from "../../../../commands/modifyModel";
  import { ModifyModelsCommand } from "../../../../commands/modifyModels";
  import { Application } from "../../../../core/application";
  import Events from "../../../../events";
  import { mixedToken, type PropertyBinding } from "../../propertiesPanel";

  export let property: PropertyBinding;

  function getValue() {
    const { nodes } = property;
    if (nodes.length === 1) {
      return nodes[0].model.getValue<boolean>(property.key);
    } else {
      let values = new Set<boolean>();
      nodes.forEach((node) =>
        values.add(node.model.getValue<boolean>(property.key))
      );
      if (values.size === 1) {
        const [firstValue] = values;
        return firstValue;
      } else {
        return mixedToken;
      }
    }
  }

  function setValue(bool: boolean) {
    value = bool;

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

    Events.editor.propertyModified.emit(property);
  }

  let value: boolean | string;
  let isDown = false;

  $: (value = getValue()), property;

  const onMouseDown = () => {
    isDown = true;
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseUp = () => {
    isDown = false;
    window.removeEventListener("mouseup", onMouseUp);
    setValue(!!!value);
  };
</script>

<checkbox-control
  class={`${isDown ? "down" : "up"} ${
    value === true ? "checked" : value === mixedToken ? "mixed" : "unchecked"
  }`}
  tabindex="0"
  on:mousedown={onMouseDown}>
  <div class="state">
    {#if value === mixedToken}
      <span>-</span>
    {:else if value === true}
      <span>x</span>
    {/if}
  </div>
</checkbox-control>

<style>
  checkbox-control {
    width: 16px;
    height: 16px;
    display: flex;
    border-radius: 3px;
    padding: 8px;
    background-color: #666;
    border: 1px outset #777;
    color: white;
    cursor: pointer;
  }

  checkbox-control:hover {
    border-color: #ccc !important;
  }

  checkbox-control.down,
  checkbox-control.checked {
    background-color: #444;
    border: 1px inset #727272;
  }

  .state {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    font-weight: bold;
    font-size: 12px;
    border-radius: 3px;
  }
</style>
