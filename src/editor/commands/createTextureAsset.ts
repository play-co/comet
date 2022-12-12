import { Cache } from '../../core/cache';
import type { TextureAssetNode } from '../../core/nodes/concrete/meta/assets/textureAssetNode';
import { registerInstance } from '../../core/nodes/instances';
import { Command } from '../core/command';

export interface CreateTextureAssetCommandParams
{
    file: File;
}

export interface CreateTextureAssetCommandReturn
{
    promise: Promise<TextureAssetNode>;
}

export class CreateTextureAssetCommand extends Command<CreateTextureAssetCommandParams, CreateTextureAssetCommandReturn>
{
    public static commandName = 'CreateAsset';

    protected async upload(file: File)
    {
        // const { app, datastore } = this;

        // const storageKey = await app.storageProvider.upload(file);
        // const asset = new TextureAssetNode(undefined, file.name, storageKey, file.type, file.size, file);
        // const imageElement = await asset.getResource();

        // asset.properties.width = imageElement.naturalWidth;
        // asset.properties.height = imageElement.naturalHeight;

        // registerInstance(asset);

        // await datastore.createTexture(asset);

        // Cache.textures.add(asset);

        // return asset;

    }

    public apply(): CreateTextureAssetCommandReturn
    {
        // const { params: { file } } = this;

        // const promise = this.upload(file);

        // return { promise };
    }

    public undo(): void
    {
        throw new Error('Unimplemented');
    }
}
