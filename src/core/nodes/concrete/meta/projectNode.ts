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

    public getFolder(name: ProjectFolderName)
    {
        const folder = this.children.find((child) => child.cast<FolderNode>().model.getValue('name') === name);

        if (!folder)
        {
            throw new Error(`Project folder "${name}" not found`);
        }

        return folder;
    }
}

