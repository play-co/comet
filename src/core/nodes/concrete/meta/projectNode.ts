import { MetaNode } from '../../abstract/metaNode';
import type { FolderNode } from './folderNode';

export type ProjectFolderName =
| 'Textures'
| 'Scenes'
| 'Prefabs';

export class ProjectNode extends MetaNode
{
    public nodeType()
    {
        return 'Project';
    }

    public getRootFolder(name: ProjectFolderName)
    {
        const folder = this.children.find((child) => child.cast<FolderNode>().model.getValue('name') === name);

        if (!folder)
        {
            throw new Error(`Project folder "${name}" not found`);
        }

        return folder;
    }

    public getAsset(id: string)
    {
        return this.walk<MetaNode, {node: MetaNode | undefined}>((node, options) =>
        {
            if (node.id === id)
            {
                options.data.node = node;
                options.cancel = true;
            }
        }, {
            includeSelf: false,
        }).node;
    }
}

