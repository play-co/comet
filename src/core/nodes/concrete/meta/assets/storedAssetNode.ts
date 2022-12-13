import { ModelSchema } from '../../../../model/schema';
import type { ClonableNodeModel, NewNodeOptions } from '../../../abstract/clonableNode';
import { MetaNode } from '../../../abstract/metaNode';

export interface StoredAssetNodeModel extends ClonableNodeModel
{
    storageKey: string;
    mimeType: string;
    size: number;
}

export const storedAssetNodeModelSchema = new ModelSchema<StoredAssetNodeModel>({
    storageKey: {
        defaultValue: '',
        category: 'asset',
    },
    mimeType: {
        defaultValue: '',
        category: 'asset',
    },
    size: {
        defaultValue: 0,
        category: 'asset',
    },
});

export abstract class StoredAssetNode<M extends StoredAssetNodeModel, ResourceType> extends MetaNode<M>
{
    public blob?: Blob;
    public resource?: ResourceType;

    constructor(
        options: NewNodeOptions<M> = {},
        blob?: Blob,
    )
    {
        super(options);

        this.blob = blob;
    }

    get isResourceReady()
    {
        return !!this.resource;
    }

    public setBlob(blob: Blob)
    {
        this.blob = blob;
    }

    public abstract getResource(): Promise<ResourceType>;
}
