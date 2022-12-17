import type { SpriteNode } from '../../core/nodes/concrete/display/spriteNode';
import type { TextureAssetNode } from '../../core/nodes/concrete/meta/assets/textureAssetNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';
import { AddChildCommand } from './addChild';
import { CreateNodeCommand } from './createNode';
import { ModifyModelCommand } from './modifyModel';
import { RemoveChildCommand } from './removeChild';

export interface CreateTextureAssetCommandParams
{
    folderParentId?: string;
    file: File;
    createSpriteAtPoint?: { x: number; y: number };
}

export interface CreateTextureAssetCommandReturn
{
    promise: Promise<TextureAssetNode>;
}

export interface CreateTextureAssetCommandCache
{
    node: TextureAssetNode;
    createCommand?: AddChildCommand;
    createdSprites?: SpriteNode[];
}

export class CreateTextureAssetCommand
    extends Command<CreateTextureAssetCommandParams, CreateTextureAssetCommandReturn, CreateTextureAssetCommandCache>
{
    public static commandName = 'CreateAsset';

    protected async upload()
    {
        const { app, params: { folderParentId, file, createSpriteAtPoint } } = this;

        const storageKey = await app.storageProvider.upload(file);

        const parentId = folderParentId ?? app.project.getRootFolder('Textures').id;

        const nodeSchema = createNodeSchema('TextureAsset', {
            parent: parentId,
            model: {
                name: file.name,
                storageKey,
                mimeType: file.type,
                size: file.size,
            },
        });

        const { node } = new CreateNodeCommand({ nodeSchema }).run();

        const asset = node.cast<TextureAssetNode>();
        const imageElement = await asset.getResource();

        new ModifyModelCommand({
            nodeId: asset.id,
            values: {
                width: imageElement.naturalWidth,
                height: imageElement.naturalHeight,
            },
            updateMode: 'full',
        }).run();

        asset.setBlob(file);
        asset.resource = imageElement;

        if (createSpriteAtPoint)
        {
            const parentId = app.viewport.rootNode.id;
            const command = new AddChildCommand({
                parentId,
                nodeSchema: createNodeSchema('Sprite', {
                    parent: parentId,
                    model: {
                        x: createSpriteAtPoint.x - (imageElement.width / 2),
                        y: createSpriteAtPoint.y - (imageElement.height / 2),
                        textureAssetId: asset.id,
                        tint: 0xffffff,
                    } }) });

            this.cache.createCommand = command;
            const { nodes } = command.run();

            this.cache.createdSprites = nodes.map((n) => n.cast<SpriteNode>());

            const node = nodes[0] as unknown as SpriteNode;

            app.selection.hierarchy.set(node.asClonableNode());
        }

        this.cache.node = asset;

        return asset;
    }

    public apply(): CreateTextureAssetCommandReturn
    {
        if (this.hasRun)
        {
            const { cache: { node, createdSprites } } = this;

            this.app.restoreNode(node.id);

            if (createdSprites)
            {
                createdSprites.forEach((sprite) => this.app.restoreNode(sprite.id));
            }

            return { promise: Promise.resolve(this.cache.node) };
        }

        // defer to an async function and return a promise since the command architecture is synchronous
        const promise = this.upload();

        return { promise };
    }

    public undo(): void
    {
        const { cache: { node, createCommand } } = this;

        new RemoveChildCommand({ nodeId: node.id }).run();

        if (createCommand)
        {
            createCommand.undo();
        }
    }
}
