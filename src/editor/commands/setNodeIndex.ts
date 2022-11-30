import type { ClonableNode } from '../../core';
import type { GraphNode } from '../../core/nodes/abstract/graphNode';
import type { ContainerNode } from '../../core/nodes/concrete/container';
import { type UpdateMode, Command } from '../core/command';

export interface SetNodeIndexCommandParams
{
    nodeId: string;
    index: number;
    updateMode: UpdateMode;
}

export interface SetNodeIndexCommandCache
{
    prevChildArray: GraphNode[];
}

export class SetNodeIndexCommand
    extends Command<SetNodeIndexCommandParams, void, SetNodeIndexCommandCache>
{
    public static commandName = 'SetNodeIndex';

    public apply(): void
    {
        const { datastore, params: { nodeId, index, updateMode }, cache } = this;

        const sourceNode = this.getInstance(nodeId);
        const parentId = sourceNode.parent?.id;

        if (parentId)
        {
            const parentNode = this.getInstance(parentId);

            cache.prevChildArray = [...parentNode.children];

            parentNode.setChildIndex(sourceNode, index);

            if (updateMode === 'full')
            {
                const childIds = parentNode.children
                    .filter((node) => !node.cast<ClonableNode>().isCloaked)
                    .map((node) => node.id);

                datastore.setNodeChildren(parentId, childIds);
            }
        }
    }

    public undo(): void
    {
        const { datastore, params: { nodeId, updateMode }, cache } = this;

        const sourceNode = this.getInstance<ContainerNode>(nodeId);
        const parentId = sourceNode.parent?.id;

        if (parentId)
        {
            const parentNode = this.getInstance(parentId);

            parentNode.children = [...cache.prevChildArray];

            sourceNode.updateViewIndex();

            if (updateMode === 'full')
            {
                const childIds = cache.prevChildArray
                    .filter((node) => !node.cast<ClonableNode>().isCloaked)
                    .map((node) => node.id);

                datastore.setNodeChildren(parentId, childIds);
            }
        }
    }
}
