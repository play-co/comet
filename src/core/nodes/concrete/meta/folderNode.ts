import { ModelSchema } from '../../../model/schema';
import { type ClonableNodeModel, clonableNodeSchema } from '../../abstract/clonableNode';
import { MetaNode } from '../../abstract/metaNode';
import type { ProjectFolderName } from './projectNode';

export interface FolderNodeModel extends ClonableNodeModel
{
    isReadOnly: boolean;
}

export const folderNodeModelSchema = new ModelSchema<FolderNodeModel>({
    ...clonableNodeSchema.properties,
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

    public isRootFolder(name?: ProjectFolderName)
    {
        if (this.parent && this.parent.nodeType() !== 'Project')
        {
            return false;
        }

        if (name)
        {
            return this.model.getValue('name') === name;
        }

        return true;
    }

    public getRootFolder(): FolderNode
    {
        if (this.isRootFolder())
        {
            return this.cast<FolderNode>();
        }

        return this.walk<FolderNode, {node: FolderNode}>((node, options) =>
        {
            if (node.isRootFolder())
            {
                options.data.node = node;

                options.cancel = true;
            }
        }, {
            includeSelf: false,
            direction: 'up',
        }).node;
    }
}
