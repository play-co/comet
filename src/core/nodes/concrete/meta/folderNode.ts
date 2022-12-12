import type { ModelSchema } from '../../../model/schema';
import { type ClonableNodeModel, clonableNodeSchema } from '../../abstract/clonableNode';
import { MetaNode } from '../../abstract/metaNode';

export class FolderNode<M extends ClonableNodeModel = ClonableNodeModel> extends MetaNode<M>
{
    public nodeType(): string
    {
        return 'Folder';
    }

    public modelSchema(): ModelSchema<M>
    {
        return clonableNodeSchema as unknown as ModelSchema<M>;
    }
}
