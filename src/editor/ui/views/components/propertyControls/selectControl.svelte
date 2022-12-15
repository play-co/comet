<script lang="ts">
  import { TextureAssetNode } from "../../../../../core/nodes/concrete/meta/assets/textureAssetNode";
  import { getApp } from "../../../../core/application";
  import { mixedToken, type PropertyBinding } from "../../propertiesPanel";
  import { Menu } from "../menu";
  import ContextMenu from "../contextMenu.svelte";
  import Events from "../../../../events";
  import type { ModifyModelCommandParams } from "../../../../commands/modifyModel";
  import { ModifyModelsCommand } from "../../../../commands/modifyModels";

  export let property: PropertyBinding;

  const app = getApp();

  let container: HTMLElement;
  let value: string;
  let none = false;

  let menu: Menu | undefined = undefined;

  $: (value = getValue()), property;

  function format(val: string | null) {
    if (val === null) {
      none = true;
      return "";
    }
    return val;
  }

  function getValue() {
    const { nodes } = property;
    const propValue = nodes[0].model.getValue<string>(property.key);

    if (nodes.length === 1) {
      return format(propValue);
    } else {
      let values = new Set();

      nodes.forEach((node) => {
        const propValue = node.model.getValue<string>(property.key);
        values.add(propValue);
      });

      return values.size === 1 ? format(propValue) : mixedToken;
    }
  }

  function setValue(textureAssetId: string) {
    const modifications: ModifyModelCommandParams<any>[] = [];

    property.nodes.forEach((node) => {
      const values: any = {
        textureAssetId,
      };

      modifications.push({
        nodeId: node.id,
        values,
        updateMode: "full",
      });
    });

    app.undoStack.exec(new ModifyModelsCommand({ modifications }));

    Events.editor.propertyModified.emit(property);
  }

  const onMouseDown = (e: MouseEvent) => {
    const textures = app.project.getRootFolder("Textures").getAllChildrenByType(TextureAssetNode);

    menu = new Menu(
      textures.map((texture) => ({
        label: texture.model.getValue("name"),
        data: texture.id,
        onClick: () => {
          setValue(texture.id);
        },
      }))
    );

    setTimeout(() => {
      Events.editor.contextMenuOpen.emit(e);
    }, 0);
  };
</script>

<select-control bind:this={container}>
  <input
    readonly
    type="text"
    class={value === mixedToken || none ? "mixed" : "normal"}
    placeholder={none ? "none" : undefined}
    {value}
    on:mousedown={onMouseDown}
  />
  {#if menu}
    <ContextMenu {menu} {container} />
  {/if}
</select-control>

<style>
  select-control {
    font-size: 12px;
    border-radius: 5px;
    position: relative;
  }

  input {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
</style>
