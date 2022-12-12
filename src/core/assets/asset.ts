import { newId } from '../nodes/instances';

export type AssetCacheKey = 'textures';

export abstract class Asset
{
    public id: string;

    public name: string;

    constructor(id: string | undefined, name: string)
    {
        this.id = id ?? newId('Asset');

        this.name = name;
    }
}
