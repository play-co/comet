import type { GraphNode } from './abstract/graphNode';

export type WalkReturnData = Record<string, any>;

export interface WalkOptions
{
    includeSelf?: boolean;
    depth: number;
    cancel: boolean;
    direction: 'up' | 'down';
    data: WalkReturnData;
}

export const defaultWalkOptions: WalkOptions = {
    includeSelf: true,
    depth: 0,
    cancel: false,
    direction: 'down',
    data: {},
};

export function sortNodesByDepth(nodes: GraphNode[])
{
    // First, we'll create a map that stores the depth of each node
    const depths = new Map<GraphNode, number>();

    // Next, we'll define a function that calculates the depth of a node
    function calculateDepth(node: GraphNode, depth = 0): number
    {
        // If we have already calculated the depth of this node, we'll return it
        if (depths.has(node))
        {
            return depths.get(node) as number;
        }

        // If this is the root node (it has no parent), we'll return the current depth
        if (!node.parent)
        {
            return depth;
        }

        // Otherwise, we'll calculate the depth of the parent and add 1
        const parentDepth = calculateDepth(node.parent, depth + 1);

        depths.set(node, parentDepth + 1);

        return parentDepth + 1;
    }

    // Next, we'll calculate the depth of each node
    for (const node of nodes)
    {
        calculateDepth(node);
    }

    // Finally, we'll sort the nodes by their depth
    return nodes.sort((a, b) => (depths.get(a) as number) - (depths.get(b) as number));
}

export function sortNodesByCreationId(nodes: GraphNode[])
{
    return nodes.sort((a, b) => a.creationId - b.creationId);
}

