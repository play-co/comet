import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import { registerInstance } from '../../core/nodes/instances';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { type UpdateMode, Command } from '../core/command';
import { RemoveNodeCommand } from './removeNode';
import { SetParentCommand } from './setParent';

export interface CloneCommandParams
{
    nodeId: string;
    newParentId?: string;
    cloneMode: CloneMode;
    depth?: number;
    updateMode?: UpdateMode;
}

export interface CloneCommandReturn
{
    sourceNode: ClonableNode;
    clonedNode: ClonableNode;
    originalNode: ClonableNode;
}

export interface CloneCommandCache extends CloneCommandReturn
{
    originalNode: ClonableNode;
    clonedNode: ClonableNode;
    commands: RemoveNodeCommand[];
}

export class CloneCommand
    extends Command<CloneCommandParams, CloneCommandReturn, CloneCommandCache>
{
    public static commandName = 'Clone';

    public apply(): CloneCommandReturn
    {
        const { datastore, params: { nodeId, cloneMode, newParentId, depth, updateMode = 'full' }, cache } = this;

        const sourceNode = this.getInstance(nodeId);
        const originalNode = sourceNode.getCloneTarget();
        const cloneInfoSchema = getCloneInfoSchema(originalNode);

        const clonedNodes: ClonableNode[] = [];

        // clone original
        const clonedNode = originalNode.clone(cloneMode, depth);

        if (updateMode === 'full')
        {
            // update originals new cloneInfo
            datastore.updateCloneInfo(originalNode.id, cloneInfoSchema);
        }

        // prepare cache
        cache.commands = [];
        cache.originalNode = originalNode;
        cache.clonedNode = clonedNode;

        // for each cloned node (including primary cloned node)...
        clonedNode.walk<ClonableNode>((node) =>
        {
            const nodeSchema = {
                ...getNodeSchema(node),
                cloneInfo: getCloneInfoSchema(node),
            };

            if (updateMode === 'full')
            {
                // create the datastore version of the cloned graph node
                datastore.createNode(nodeSchema);

                // update parenting info in datastore to trigger remote users
                if (node.parent)
                {
                    datastore.setParent(node.id, node.parent.id);
                }
            }

            // register the graph node
            registerInstance(node);

            if (updateMode === 'full')
            {
                // update the cloners cloneInfo in the datastore
                const clonerId = nodeSchema.cloneInfo.cloner;

                if (clonerId)
                {
                    const cloner = this.getInstance(clonerId);
                    const cloneInfoSchema = getCloneInfoSchema(cloner);

                    datastore.updateCloneInfo(clonerId, cloneInfoSchema);
                }
            }

            // track for return
            clonedNodes.push(node);

            // track for cache
            cache.commands.push(new RemoveNodeCommand({ nodeId: node.id }));
        });

        // set parent if provided
        if (newParentId)
        {
            new SetParentCommand({ parentId: newParentId, nodeId: clonedNode.id, updateMode, preserveTransform: true }).run();
        }

        cache.sourceNode = sourceNode;
        cache.clonedNode = clonedNode;
        cache.originalNode = originalNode;

        return {
            sourceNode,
            clonedNode,
            originalNode,
        };
    }

    public undo(): void
    {
        const { datastore, params: { updateMode = 'full' }, cache: { commands, originalNode, clonedNode } } = this;

        originalNode.cloneInfo.removeCloned(clonedNode);

        if (updateMode === 'full')
        {
            const cloneInfoSchema = getCloneInfoSchema(originalNode);

            datastore.updateCloneInfo(originalNode.id, cloneInfoSchema);
        }

        for (let i = commands.length - 1; i >= 0; i--)
        {
            commands[i].apply();
        }
    }

    public redo()
    {
        const { datastore, params: { updateMode = 'full' }, cache: { commands, originalNode, clonedNode } } = this;

        originalNode.cloneInfo.addCloned(clonedNode);

        if (updateMode === 'full')
        {
            const cloneInfoSchema = getCloneInfoSchema(originalNode);

            datastore.updateCloneInfo(originalNode.id, cloneInfoSchema);
        }

        for (let i = 0; i < commands.length; i++)
        {
            commands[i].undo();
        }
    }

    public restoreSelection(mode: 'redo' | 'undo')
    {
        if (mode === 'redo')
        {
            this.app.selection.hierarchy.set(this.cache.clonedNode);
        }
        else
        {
            super.restoreSelection(mode);
        }
    }
}
