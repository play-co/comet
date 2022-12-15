import { MetaNode } from '../../abstract/metaNode';
import type { FolderNode } from './folderNode';

export type ProjectFolderName =
| 'Textures'
| 'Scenes'
| 'Prefabs';

export class ProjectNode extends MetaNode
{
    public isReady = false;

    public copy(other: ProjectNode)
    {
        this.children = other.children;
        this.model = other.model;
        this.view = other.view;
        this.defineCustomProperties = other.defineCustomProperties;
        this.assignCustomProperty = other.assignCustomProperty;
    }

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

        return folder.cast<FolderNode>();
    }

    public findAssetById(id: string)
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

    public getAssetFolders(): Record<ProjectFolderName, FolderNode>
    {
        const folders: Record<ProjectFolderName, FolderNode> = {
            Textures: this.getRootFolder('Textures'),
            Scenes: this.getRootFolder('Scenes'),
            Prefabs: this.getRootFolder('Prefabs'),
        };

        return folders;
    }
}

