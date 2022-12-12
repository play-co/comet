import type { TextureAsset } from '../nodes/concrete/meta/assets/textureAssetNode';
import { CacheBase } from './cacheBase';

export class TextureCache extends CacheBase<TextureAsset>
{
    protected get type()
    {
        return 'Texture';
    }
}
