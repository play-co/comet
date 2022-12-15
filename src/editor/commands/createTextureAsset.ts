import type { TextureAssetNode } from '../../core/nodes/concrete/meta/assets/textureAssetNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';
import { type CreateNodeCommandReturn, CreateNodeCommand } from './createNode';
import { ModifyModelCommand } from './modifyModel';

export interface CreateTextureAssetCommandParams
{
    folderParentId?: string;
    file: File;
}

export interface CreateTextureAssetCommandReturn
{
    promise: Promise<TextureAssetNode>;
}

export class CreateTextureAssetCommand extends Command<CreateTextureAssetCommandParams, CreateTextureAssetCommandReturn>
{
    public static commandName = 'CreateAsset';

    protected async upload()
    {
        const { app, params: { folderParentId, file } } = this;

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

        const { node } = app.undoStack.exec<CreateNodeCommandReturn>(new CreateNodeCommand({ nodeSchema }));

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

        return asset;
    }

    public apply(): CreateTextureAssetCommandReturn
    {
        // defer to an async function and return a promise since the command architecture is synchronous
        const promise = this.upload();

        return { promise };
    }

    public undo(): void
    {
        throw new Error('Unimplemented');
    }
}
