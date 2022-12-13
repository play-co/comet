import { ModelSchema } from '../../../model/schema';
import type { ClonableNodeModel } from '../../abstract/clonableNode';
import { MetaNode } from '../../abstract/metaNode';

export interface FolderNodeModel extends ClonableNodeModel
{
    isReadOnly: boolean;
}

export const folderNodeModelSchema = new ModelSchema<FolderNodeModel>({
    isReadOnly: {
        defaultValue: false,
        category: 'node',
    },
});

export class FolderNode<M extends ClonableNodeModel = ClonableNodeModel> extends MetaNode<M>
{
    public nodeType(): string
    {
        return 'Folder';
    }

    public modelSchema(): ModelSchema<M>
    {
        return folderNodeModelSchema as unknown as ModelSchema<M>;
    }
}
