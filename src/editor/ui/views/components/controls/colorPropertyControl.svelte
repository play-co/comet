<script lang="ts">
  import Color from "color";
  import { getGlobalEmitter } from "../../../../../core/events";
  import type { ModifyModelCommandParams } from "../../../../commands/modifyModel";
  import { ModifyModelsCommand } from "../../../../commands/modifyModels";
  import { Application } from "../../../../core/application";
  import type { UpdateMode } from "../../../../core/command";
  import type { EditorEvent } from "../../../../events/editorEvents";
  import type { PropertyBinding } from "../../propertiesPanel";
  import ColorPickerButton from "./colorPickerButton.svelte";

  export let property: PropertyBinding;
  export let setAlpha = true;

  const editorEmitter = getGlobalEmitter<EditorEvent>();

  const initalValues: Map<string, object> = new Map();

  function getInitialColor() {
    const firstNodeColor = property.nodes[0].model.getValue<number>(
      property.key
    );

    initalValues.clear();

    property.nodes.forEach((node) => {
      const values: any = {};

      values[property.key] = node.model.getValue<number>(property.key);

      if (setAlpha) {
        values.alpha = node.model.getValue<number>("alpha");
      }

      initalValues.set(node.id, values);
    });

    let alpha = 1;

    if (setAlpha) {
      alpha = property.nodes[0].model.getValue<number>("alpha");
    }

    if (property.nodes.length === 1) {
      return Color(firstNodeColor).alpha(alpha).hexa();
    }

    let c = Color(firstNodeColor);

    property.nodes.forEach((node) => {
      let alpha = 1;

      if (setAlpha) {
        alpha = node.model.getValue<number>("alpha");
      }

      c = c.mix(
        Color(node.model.getValue<number>(property.key)).alpha(alpha),
        0.5
      );
    });

    return c.hexa();
  }

  function setValue(color: Color, updateMode: UpdateMode) {
    const modifications: ModifyModelCommandParams<any>[] = [];

    const value = color.rgbNumber();
    const alpha = color.alpha();

    property.nodes.forEach((node) => {
      const values: any = {};

      values[property.key] = value;

      if (setAlpha) {
        values.alpha = alpha;
      }

      const modification: ModifyModelCommandParams<any> = {
        nodeId: node.id,
        values,
        updateMode,
      };

      if (updateMode === "full") {
        modification.prevValues = initalValues.get(node.id);
      }

      modifications.push(modification);
    });

    if (updateMode === "graphOnly") {
      new ModifyModelsCommand({ modifications }).run();
    } else {
      Application.instance.undoStack.exec(
        new ModifyModelsCommand({ modifications })
      );
    }

    editorEmitter.emit("editor.property.modified", property);
  }

  let color: string;

  $: (color = getInitialColor()), property;

  const onChange = (e: CustomEvent<string>) => {
    const color = Color(e.detail);
    setValue(color, "graphOnly");
  };

  const onAccept = (e: CustomEvent<string>) => {
    const color = Color(e.detail);
    console.log("ACCEPT", color.rgbNumber());
    setValue(color, "full");
  };
</script>

<color-picker-control>
  <ColorPickerButton {color} on:change={onChange} on:accept={onAccept} />
</color-picker-control>

<style>
  color-picker-control {
    border: 2px outset #6a6a6a;
    height: 24px;
    margin-bottom: 5px;
    border-radius: 3px;
  }
</style>
