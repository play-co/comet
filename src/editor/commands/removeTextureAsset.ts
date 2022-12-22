import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { MetaNode } from '../../core/nodes/abstract/metaNode';
import { type SpriteModel, SpriteNode } from '../../core/nodes/concrete/display/spriteNode';
import { TextureAssetNode } from '../../core/nodes/concrete/meta/assets/textureAssetNode';
import type { FolderNode } from '../../core/nodes/concrete/meta/folderNode';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import Events from '../events';
import { ModifyModelCommand } from './modifyModel';
import { RemoveChildCommand } from './removeChild';

export interface RemoveTextureAssetCommandParams
{
    nodeIds: string[];
}

export interface RemoveTextureAssetCommandReturn
{
    nodes: (FolderNode | TextureAssetNode)[];
}

export interface RemoveTextureAssetCommandCache
{
    modifyModelCommands: ModifyModelCommand<SpriteModel>[];
    removeChildCommands: RemoveChildCommand[];
}

export class RemoveTextureAssetCommand
    extends Command<RemoveTextureAssetCommandParams, RemoveTextureAssetCommandReturn, RemoveTextureAssetCommandCache>
{
    public static commandName = 'RemoveTextureAsset';

    public apply(): RemoveTextureAssetCommandReturn
    {
        const { cache, params: { nodeIds } } = this;
        const app = getApp();

        // * find all textures by walking root texture asset folder
        // * for all sprite used by each texture:
        //   - create a ModifyModels command to reset their textureAssetId to null (store in cache commands)
        // * for all textures being removed:
        //   - create a RemoveChild command to remove the texture asset node (store in cache commands)
        // * for undo, undo the cached commands (in reverse order)

        cache.modifyModelCommands = [];
        cache.removeChildCommands = [];

        const textureNodes: TextureAssetNode[] = [];

        nodeIds.forEach((nodeId) =>
        {
            const node = this.getInstance(nodeId);

            node.walk<MetaNode, MetaNode[]>((node, options) =>
            {
                if (node.is(TextureAssetNode))
                {
                    options.data.push(node);
                }
            }, {
                data: textureNodes,
            });
        });

        textureNodes.forEach((textureNode) =>
        {
            const spriteDependants = app.project.walk<ClonableNode, SpriteNode[]>((node, options) =>
            {
                if (node.is(SpriteNode))
                {
                    const sprite = node.cast<SpriteNode>();

                    if (sprite.model.getValue<string>('textureAssetId') === textureNode.id)
                    {
                        options.data.push(node);
                    }
                }
            }, {
                includeSelf: false,
                data: [],
            });

            // clear model of dependant sprites and clear texture
            spriteDependants.forEach((sprite) =>
            {
                const command = new ModifyModelCommand({
                    nodeId: sprite.id,
                    values: {
                        textureAssetId: null,
                    },
                    updateMode: 'full',
                });

                cache.modifyModelCommands.push(command);
                command.run();
                sprite.clearTexture();
                Events.datastore.node.local.textureRemoved.emit({ nodeId: sprite.id });
            });
        });

        const deletedNodes: (FolderNode | TextureAssetNode)[] = [];

        nodeIds.forEach((nodeId) =>
        {
            const command = new RemoveChildCommand({
                nodeId,
            });

            cache.removeChildCommands.push(command);
            const { nodes } = command.run();

            deletedNodes.push(...nodes as (FolderNode | TextureAssetNode)[]);
        });

        return { nodes: deletedNodes };
    }

    public undo(): void
    {
        const { cache: { modifyModelCommands, removeChildCommands } } = this;

        // undo commands in reverse order

        for (let i = modifyModelCommands.length - 1; i >= 0; i--)
        {
            const command = modifyModelCommands[i];

            this.getInstance(command.params.nodeId);

            command.undo();
        }

        for (let i = removeChildCommands.length - 1; i >= 0; i--)
        {
            const command = removeChildCommands[i];

            this.getInstance(command.params.nodeId);

            command.undo();
        }
    }
}
