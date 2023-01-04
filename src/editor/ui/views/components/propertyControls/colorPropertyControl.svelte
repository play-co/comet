<script lang="ts">
  import Color from "color";
  import type { ModifyModelCommandParams } from "../../../../commands/modifyModel";
  import { ModifyModelsCommand } from "../../../../commands/modifyModels";
  import { Application, getApp } from "../../../../core/application";
  import type { UpdateMode } from "../../../../core/command";
  import Events from "../../../../events";
  import type { PropertyBinding } from "../../propertiesPanel";
  import ColorPickerButton from "./colorPickerButton.svelte";

  export let property: PropertyBinding;
  export let setAlpha = true;

  const app = getApp();

  type ColorInfo = {
    prev: string;
    next: string;
  };

  let button: ColorPickerButton;

  const initialValues: Map<string, object> = new Map();
  const undoStack: Map<number, ColorInfo> = new Map();

  function getInitialColor() {
    const firstNodeColor = property.nodes[0].model.getValue<number>(property.key);

    initialValues.clear();

    property.nodes.forEach((node) => {
      const values: any = {};

      values[property.key] = node.model.getValue<number>(property.key);

      if (setAlpha) {
        values.alpha = node.model.getValue<number>("alpha");
      }

      initialValues.set(node.id, values);
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

      c = c.mix(Color(node.model.getValue<number>(property.key)).alpha(alpha), 0.5);
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
        modification.prevValues = initialValues.get(node.id);
      }

      modifications.push(modification);
    });

    const command = new ModifyModelsCommand({ modifications });

    if (updateMode === "graphOnly") {
      command.run();
    } else {
      const head = app.undoStack.head + 1;

      if (!undoStack.has(head)) {
        undoStack.set(head, {
          prev: lastColor,
          next: color.hexa(),
        });
        lastColor = color.hexa();
      }

      console.log("set", color.rgbNumber());

      Application.instance.undoStack.exec(command);
    }

    Events.editor.propertyModified.emit(property);
  }

  let color: string;
  let lastColor = getInitialColor();

  $: (color = getInitialColor()), property;

  const onChange = (e: CustomEvent<string>) => {
    const color = Color(e.detail);
    setValue(color, "graphOnly");
  };

  const onAccept = (e: CustomEvent<string>) => {
    const color = Color(e.detail);
    setValue(color, "full");
  };

  Events.command.undo.bind(() => {
    // const head = app.undoStack.head;
    // console.log("undo", head);
    // if (undoStack.has(head)) {
    //   button.reload((undoStack.get(head) as ColorInfo).prev);
    // }
    // button.reload(getInitialColor());
  });
  Events.command.redo.bind(() => {
    // const head = app.undoStack.head + 1;
    // console.log("redo", head);
    // if (undoStack.has(head)) {
    //   button.reload((undoStack.get(head) as ColorInfo).next);
    // }
    // button.reload(getInitialColor());
  });

  // Events.$("command.(undo|redo)", () => {
  //   if (button.isOpen()) {
  //     button.reload(getInitialColor());
  //   }
  // });
</script>

<color-picker-control>
  <ColorPickerButton bind:this={button} {color} on:change={onChange} on:accept={onAccept} />
</color-picker-control>

<style>
  color-picker-control {
    height: 24px;
    margin-bottom: 5px;
    border-radius: 3px;
  }
</style>
