import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CloneMode } from '../../core/nodes/cloneInfo';
import { registerInstance } from '../../core/nodes/instances';
import { getCloneInfoSchema, getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';
import { RemoveNodeCommand } from './removeNode';
import { SetParentCommand } from './setParent';

export interface CloneCommandParams
{
    nodeId: string;
    cloneMode: CloneMode;
    newParentId?: string;
    depth?: number;
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
        const { datastore, params: { nodeId, cloneMode, newParentId, depth }, cache } = this;

        const sourceNode = this.getInstance(nodeId);
        const originalNode = sourceNode.getCloneTarget();
        const cloneInfoSchema = getCloneInfoSchema(originalNode);

        const clonedNodes: ClonableNode[] = [];

        // clone original
        const clonedNode = originalNode.clone(cloneMode, depth);

        // update originals new cloneInfo
        datastore.updateNodeCloneInfo(originalNode.id, cloneInfoSchema);

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

            // create the datastore version of the cloned graph node
            datastore.createNode(nodeSchema);

            // update parenting info in datastore to trigger remote users
            if (node.parent)
            {
                datastore.setNodeParent(node.id, node.parent.id);
            }

            // register the graph node
            registerInstance(node);

            // update the cloners cloneInfo in the datastore
            const clonerId = nodeSchema.cloneInfo.cloner;

            if (clonerId)
            {
                const cloner = this.getInstance(clonerId);
                const cloneInfoSchema = getCloneInfoSchema(cloner);

                datastore.updateNodeCloneInfo(clonerId, cloneInfoSchema);
            }

            // track for return
            clonedNodes.push(node);

            // track for cache
            cache.commands.push(new RemoveNodeCommand({ nodeId: node.id }));
        });

        // set parent if provided
        if (newParentId)
        {
            new SetParentCommand({ parentId: newParentId, nodeId: clonedNode.id, updateMode: 'full' }).run();
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
        const { datastore, cache: { commands, originalNode, clonedNode } } = this;

        originalNode.cloneInfo.removeCloned(clonedNode);
        const cloneInfoSchema = getCloneInfoSchema(originalNode);

        datastore.updateNodeCloneInfo(originalNode.id, cloneInfoSchema);

        for (let i = commands.length - 1; i >= 0; i--)
        {
            commands[i].apply();
        }
    }

    public redo()
    {
        const { datastore, cache: { commands, originalNode, clonedNode } } = this;

        originalNode.cloneInfo.addCloned(clonedNode);
        const cloneInfoSchema = getCloneInfoSchema(originalNode);

        datastore.updateNodeCloneInfo(originalNode.id, cloneInfoSchema);

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
