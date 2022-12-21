import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { MetaNode } from '../../core/nodes/abstract/metaNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { FolderNode } from '../../core/nodes/concrete/meta/folderNode';
import { getApp } from '../core/application';
import { Command } from '../core/command';
import { CloneCommand } from './clone';
import { SetParentCommand } from './setParent';

export interface CreatePrefabAssetCommandParams
{
    nodeId: string;
}

export interface CreatePrefabAssetCommandReturn
{
    node: ClonableNode;
}

export interface CreatePrefabAssetCommandCache
{
    sourceNode: ClonableNode;
    clonedNode: ClonableNode;
    commands: {
        setParent: SetParentCommand;
        clone: CloneCommand;
    };
}

export class CreatePrefabAssetCommand
    extends Command<CreatePrefabAssetCommandParams, CreatePrefabAssetCommandReturn, CreatePrefabAssetCommandCache>
{
    public static commandName = 'CreatePrefabAsset';

    public apply(): CreatePrefabAssetCommandReturn
    {
        const { cache, params: { nodeId } } = this;
        const app = getApp();
        const hierarchySelection = app.selection.hierarchy;
        const projectSelection = app.selection.project;
        const sourceNode = this.getInstance(nodeId);
        const sourceParentId = sourceNode.getParent().id;
        let assetFolderId = app.project.getRootFolder('Prefabs').id;

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

        // 3. clone sourceNode and re-parent to original scene parent
        const cloneCommand = new CloneCommand({
            nodeId,
            cloneMode: CloneMode.Reference,
            newParentId: sourceParentId,
        });

        const { clonedNode } = cloneCommand.run();

        cache.commands = {
            setParent: setParentCommand,
            clone: cloneCommand,
        };
        cache.sourceNode = sourceNode;
        cache.clonedNode = clonedNode;

        app.selection.hierarchy.set(clonedNode);
        app.selection.project.set(sourceNode);

        return { node: clonedNode };
    }

    public undo(): void
    {
        const { cache: { commands: { setParent, clone } } } = this;

        clone.undo();
        setParent.undo();
    }

    public redo()
    {
        const { cache: { commands: { setParent, clone } } } = this;

        setParent.redo();
        clone.redo();
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public restoreSelection(type: 'undo' | 'redo')
    {
        if (type === 'redo')
        {
            const { cache: { clonedNode, sourceNode } } = this;
            const app = getApp();

            app.selection.hierarchy.set(clonedNode);
            app.selection.project.set(sourceNode);
        }
        else
        {
            super.restoreSelection(type);
        }
    }
}
