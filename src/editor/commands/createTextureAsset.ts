import { TextureAsset } from '../../core/assets/textureAsset';
import { registerInstance } from '../../core/nodes/instances';
import { Command } from '../core/command';

export interface CreateTextureAssetCommandParams
{
    file: File;
}

export interface CreateTextureAssetCommandReturn
{
    promise: Promise<TextureAsset>;
}

export class CreateTextureAssetCommand extends Command<CreateTextureAssetCommandParams, CreateTextureAssetCommandReturn>
{
    public static commandName = 'CreateAsset';

    protected async upload(file: File)
    {
        const { app, datastore } = this;

        const storageKey = await app.storageProvider.upload(file);
        const asset = new TextureAsset(storageKey, file.name, file.type, file.size, file);
        const imageElement = await asset.getData();

        asset.properties.width = imageElement.naturalWidth;
        asset.properties.height = imageElement.naturalHeight;

        registerInstance(asset);

        await datastore.createTexture(asset);
        await TextureAsset.storeAsset(asset);

        return asset;
    }

    public apply(): CreateTextureAssetCommandReturn
    {
        const { params: { file } } = this;

        const promise = this.upload(file);

        return { promise };
    }

    public undo(): void
    {
        throw new Error('Unimplemented');
    }
}
