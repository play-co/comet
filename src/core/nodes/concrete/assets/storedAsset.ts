import { Asset } from './asset';

export type AssetCacheKey = 'textures';

export abstract class StoredAsset<PropertiesType = undefined, ResourceType = undefined> extends Asset
{
    public storageKey: string;
    public mimeType: string;
    public size: number;
    public blob?: Blob;
    public properties: PropertiesType;
    public resource?: ResourceType;

    constructor(id: string | undefined, name: string, storageKey: string, type: string, size: number, blob?: Blob)
    {
        super(id, name);

        // primary metadata
        this.storageKey = storageKey;
        this.name = name;
        this.mimeType = type;
        this.size = size;
        this.blob = blob;

        // properties (subclass to define)
        this.properties = {} as PropertiesType;
    }

    get isResourceReady()
    {
        return !!this.resource;
    }

    public abstract getResource(): Promise<ResourceType>;
}
