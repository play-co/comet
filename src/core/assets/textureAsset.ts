import { MIPMAP_MODES, MSAA_QUALITY, SCALE_MODES, WRAP_MODES } from 'pixi.js';

import { Cache } from '../cache';
import type { TextureAssetSchema } from '../nodes/schema';
import { blobToBas64, loadImage } from '../util/file';
import { StoredAsset } from './storedAsset';

export interface TextureAssetProperties
{
    width: number;
    height: number;
    mipmap: MIPMAP_MODES;
    multisample: MSAA_QUALITY;
    resolution: number;
    scaleMode: SCALE_MODES;
    wrapMode: WRAP_MODES;
}

export const defaultTextureAssetProperties: TextureAssetProperties = {
    width: 0,
    height: 0,
    mipmap: MIPMAP_MODES.OFF,
    multisample: MSAA_QUALITY.NONE,
    resolution: 1,
    scaleMode: SCALE_MODES.NEAREST,
    wrapMode: WRAP_MODES.CLAMP,
};

export class TextureAsset extends StoredAsset<TextureAssetProperties, HTMLImageElement>
{
    public static fromSchema(schema: TextureAssetSchema)
    {
        const { id, mimeType, name, properties, size, storageKey } = schema;

        const texture = new TextureAsset(id, name, storageKey, mimeType, size);

        texture.properties = properties;

        return texture;
    }

    public async getResource()
    {
        if (this.resource)
        {
            return this.resource;
        }

        if (!this.blob)
        {
            this.blob = await Cache.textures.fetch(this.storageKey);
        }

        const dataURI = await blobToBas64(this.blob);

        this.resource = await loadImage(dataURI);

        return this.resource;
    }
}
