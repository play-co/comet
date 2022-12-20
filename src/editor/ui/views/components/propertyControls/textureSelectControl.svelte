<script lang="ts">
  import { TextureAssetNode } from "../../../../../core/nodes/concrete/meta/assets/textureAssetNode";
  import { getApp } from "../../../../core/application";
  import { mixedToken, type PropertyBinding } from "../../propertiesPanel";
  import { Menu, type MenuItem } from "../menu";
  import ContextMenu from "../contextMenu.svelte";
  import Events from "../../../../events";
  import type { ModifyModelCommandParams } from "../../../../commands/modifyModel";
  import { ModifyModelsCommand } from "../../../../commands/modifyModels";
  import { FolderNode } from "../../../../../core/nodes/concrete/meta/folderNode";
  import type { MetaNode } from "../../../../../core/nodes/abstract/metaNode";
  import { Icons } from "../../icons";
  import type { ClonableNode } from "../../../../../core";
  import { getInstance } from "../../../../../core/nodes/instances";

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

  function getNodeValue(node: ClonableNode) {
    const textureAssetId = node.model.getValue<string>(property.key);

    if (textureAssetId === null) {
      return null;
    }

    const textureNode = getInstance<TextureAssetNode>(textureAssetId);

    return textureNode.model.getValue<string>("name");
  }

  function getValue() {
    const { nodes } = property;
    const propValue = getNodeValue(nodes[0]);

    if (nodes.length === 1) {
      return format(propValue);
    } else {
      let values = new Set();

      nodes.forEach((node) => {
        const propValue = getNodeValue(node);
        values.add(propValue);
      });

      return values.size === 1 ? format(propValue) : mixedToken;
    }
  }

  function setValue(textureAssetId: string | null) {
    const modifications: ModifyModelCommandParams<any>[] = [];

    property.nodes.forEach((node) => {
      if (node.model.getValue<"string" | null>("textureAssetId") === null) {
        return;
      }

      const values: any = {
        textureAssetId,
      };

      modifications.push({
        nodeId: node.id,
        values,
        updateMode: "full",
      });
    });

    if (modifications.length) {
      app.undoStack.exec(new ModifyModelsCommand({ modifications }));

      Events.editor.propertyModified.emit(property);
    }
  }

  function createMenuFromFolder(folderNode: FolderNode) {
    const menuItems: MenuItem[] = [];

    folderNode.forEach<MetaNode>((child) => {
      const label = child.model.getValue<string>("name");

      if (child.is(FolderNode)) {
        menuItems.push({
          label,
          icon: Icons.Folder,
          menu: createMenuFromFolder(child.cast<FolderNode>()),
        });
      } else if (child.is(TextureAssetNode)) {
        menuItems.push({
          label,
          icon: Icons.TextureAsset,
          data: child.id,
          onClick: () => {
            setValue(child.id);
          },
        });
      }
    });

    return new Menu(menuItems);
  }

  function update() {
    value = getValue();
  }

  // handlers
  const onMouseDown = (e: MouseEvent) => {
    menu = createMenuFromFolder(app.project.getRootFolder("Textures"));

    menu.insertItem({
      label: "<None>",
      style: "prompt",
      onClick: () => {
        setValue(null);
      },
    });

    app.openContextMenuFromEvent(e);
  };

  Events.datastore.node.local.modified.bind(update);
</script>

<select-control bind:this={container}>
  <input
    readonly
    type="text"
    class={value === mixedToken ? "mixed" : "normal"}
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
    padding: 0 10px;
    cursor: pointer;
  }
</style>
