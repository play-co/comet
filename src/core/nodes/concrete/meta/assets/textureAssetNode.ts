import { MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES } from 'pixi.js';

import { Cache } from '../../../../cache';
import { ModelSchema } from '../../../../model/schema';
import { blobToBas64, loadImage } from '../../../../util/file';
import { type StoredAssetNodeModel, StoredAssetNode } from './storedAssetNode';

export interface TextureAssetNodeModel extends StoredAssetNodeModel
{
    width: number;
    height: number;
    mipmap: MIPMAP_MODES;
    multisample: MSAA_QUALITY;
    resolution: number;
    scaleMode: SCALE_MODES;
    wrapMode: WRAP_MODES;
}

export const textureAssetNodeModelSchema = new ModelSchema<TextureAssetNodeModel>({
    width: {
        defaultValue: 0,
        category: 'asset',
    },
    height: {
        defaultValue: 0,
        category: 'asset',
    },
    mipmap: {
        defaultValue: MIPMAP_MODES.OFF,
        category: 'asset',
    },
    multisample: {
        defaultValue: MSAA_QUALITY.NONE,
        category: 'asset',
    },
    resolution: {
        defaultValue: 1,
        category: 'asset',
    },
    scaleMode: {
        defaultValue: SCALE_MODES.NEAREST,
        category: 'asset',
    },
    wrapMode: {
        defaultValue: WRAP_MODES.CLAMP,
        category: 'asset',
    },
});

export abstract class TextureAssetNode extends StoredAssetNode<TextureAssetNodeModel, HTMLImageElement>
{
    get isResourceReady()
    {
        return !!this.resource;
    }

    public nodeType()
    {
        return 'TextureAsset';
    }

    public modelSchema()
    {
        return textureAssetNodeModelSchema as unknown as ModelSchema<TextureAssetNodeModel>;
    }

    public async getResource()
    {
        if (this.resource)
        {
            return this.resource;
        }

        if (!this.blob)
        {
            const storageKey = this.model.getValue<string>('storageKey');

            this.blob = await Cache.textures.fetch(storageKey);
        }

        const dataURI = await blobToBas64(this.blob);

        this.resource = await loadImage(dataURI);

        return this.resource;
    }
}
