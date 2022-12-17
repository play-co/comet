import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { MetaNode } from '../../core/nodes/abstract/metaNode';
import { SpriteNode } from '../../core/nodes/concrete/display/spriteNode';
import { TextureAssetNode } from '../../core/nodes/concrete/meta/assets/textureAssetNode';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { RemoveChildCommand } from './removeChild';

export interface RemoveTextureAssetCommandParams
{
    nodeIds: string[];
}

export interface RemoveTextureAssetCommandReturn
{
    nodes: ClonableNode[];
}

export interface RemoveTextureAssetCommandCache
{
    commands: RemoveChildCommand[];
}

export class RemoveTextureAssetCommand
    extends Command<RemoveTextureAssetCommandParams, RemoveTextureAssetCommandReturn, RemoveTextureAssetCommandCache>
{
    public static commandName = 'RemoveTextureAsset';

    public apply(): RemoveTextureAssetCommandReturn
    {
        const { cache, params: { nodeIds } } = this;
        const app = getApp();

        // todo:
        // * find all textures from walk
        // * find all sprite usages:
        //   - create a ModifyModels command to reset their textureAssetId to null (store in cache commands)
        // * create a RemoveNodes command to remove the texture asset node (store in cache commands)
        // for undo, undo the cached commands (in reverse order)

        nodeIds.forEach((nodeId) =>
        {
            const node = this.getInstance(nodeId);

            const textureNodes = node.walk<MetaNode, MetaNode[]>((node, options) =>
            {
                if (node.is(TextureAssetNode))
                {
                    options.data.push(node);
                }
            }, {
                data: [],
            });

            textureNodes.forEach((textureNode) =>
            {
                const textureAssetId = textureNode.id;
                const spriteDependants = app.project.walk<ClonableNode, SpriteNode[]>((node, options) =>
                {
                    if (node.is(SpriteNode))
                    {
                        const sprite = node.cast<SpriteNode>();

                        if (sprite.model.getValue<string>('textureAssetId') === textureAssetId)
                        {
                            options.data.push(node);
                        }
                    }
                }, {
                    includeSelf: false,
                    data: [],
                });

                spriteDependants.forEach((sprite) =>
                {
                    sprite.clearTexture();
                });

                debugger;
            });
        });

        // / --------------
        // remove child duplicates, find highest parent node
        const allNodes: ClonableNode[] = [];

        nodeIds.forEach((nodeId) =>
        {
            const node = this.getInstance(nodeId);

            allNodes.push(node);
        });

        const filteredNodes = allNodes.filter((node) =>
        {
            for (const allNode of allNodes)
            {
                if (allNode.contains(node))
                {
                    return false;
                }
            }

            return true;
        });

        cache.commands = [];

        const deletedNodes: ClonableNode[] = [];

        filteredNodes.forEach((node) =>
        {
            const nodeId = node.id;
            const command = new RemoveChildCommand({ nodeId });

            cache.commands.push(command);

            const { nodes } = command.run();

            deletedNodes.push(...nodes);
        });

        return { nodes: deletedNodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            const command = commands[i];

            // ensure restore dependencies are available before reverting undo of single node
            this.getInstance(command.params.nodeId);

            command.undo();
        }
    }
}
