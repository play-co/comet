import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { MetaNode } from '../../core/nodes/abstract/metaNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { FolderNode } from '../../core/nodes/concrete/meta/folderNode';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { CloneCommand } from './clone';
import type { RemoveNodeCommand } from './removeNode';
import { SetParentCommand } from './setParent';

export interface CreateReferenceCommandParams
{
    nodeId: string;
}

export interface CreateReferenceCommandReturn
{
    node: ClonableNode;
}

export interface CreateReferenceCommandCache
{
    commands: {
        clone: CloneCommand;
        delete: RemoveNodeCommand;
        setParent: SetParentCommand;
    };
}

export class CreateReferenceCommand
    extends Command<CreateReferenceCommandParams, CreateReferenceCommandReturn, CreateReferenceCommandCache>
{
    public static commandName = 'CreateReferenceCommand';

    public apply(): CreateReferenceCommandReturn
    {
        const { params: { nodeId } } = this;
        const app = getApp();
        const hierarchySelection = app.selection.hierarchy;
        const projectSelection = app.selection.project;
        const sourceNode = this.getInstance(nodeId);
        const sourceParentId = sourceNode.getParent().id;
        let assetFolderId = app.project.getRootFolder('Prefabs').id;

        // 1. determine target asset folder
        // 2. remove sourceNode from scene parent by re-parenting to to asset folder
        // 3. clone sourceNode
        // 4. add to sourceNode parent in place of sourceNode

        // 1. determine target asset folder
        if (
            projectSelection.hasSelection
            && projectSelection.firstNode.cast<MetaNode>().is(FolderNode)
            && projectSelection.firstNode.cast<FolderNode>().isWithinRootFolder('Prefabs')
        )
        {
            assetFolderId = projectSelection.firstNode.cast<FolderNode>().id;
        }

        // 2. remove sourceNode from scene parent by re-parenting to to asset folder
        const setParentCommand = new SetParentCommand({ nodeId, parentId: assetFolderId, updateMode: 'full' });

        hierarchySelection.deselect();
        setParentCommand.run();

        const cloneCommand = new CloneCommand({
            nodeId,
            cloneMode: CloneMode.Reference,
            newParentId: sourceParentId,
        });

        const { clonedNode } = cloneCommand.run();

        // cache.commands = {
        //     clone: cloneCommand,
        //     setParent: setParentCommand,
        // };

        // app.selection.project.set(clonedNode.cast<MetaNode>());

        return { node: clonedNode };
    }

    public undo(): void
    {
        // const { cache: { commands } } = this;

        // for (let i = commands.length - 1; i >= 0; i--)
        // {
        //     commands[i].undo();
        //     // commands[i].restoreSelection('undo');
        // }
    }

    public redo()
    {
        // const { cache: { commands } } = this;

        // for (let i = 0; i < commands.length; i++)
        // {
        //     commands[i].redo();
        //     // commands[i].restoreSelection('redo');
        // }
    }

    // // @ts-ignore
    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // public restoreSelection(type: 'undo' | 'redo')
    // {
    //     // clone command will restore selection
    // }
}
