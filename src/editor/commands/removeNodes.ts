import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { Command } from '../core/command';
import { RemoveChildCommand } from './removeChild';

export interface RemoveNodesCommandParams
{
    nodeIds: string[];
}

export interface RemoveNodesCommandReturn
{
    nodes: ClonableNode[];
}

export interface RemoveNodesCommandCache
{
    commands: RemoveChildCommand[];
}

export class RemoveNodesCommand
    extends Command<RemoveNodesCommandParams, RemoveNodesCommandReturn, RemoveNodesCommandCache>
{
    public static commandName = 'RemoveNodes';

    public apply(): RemoveNodesCommandReturn
    {
        const { cache, params: { nodeIds } } = this;

        // remove child duplicates, find highest parent node
        const allNodes: ClonableNode[] = [];

        nodeIds.forEach((nodeId) =>
        {
            const node = this.getInstance(nodeId);

            allNodes.push(node);
        });

        const filteredNodes = allNodes.filter((node) =>
        {
            for (const allNode of allNodes)
            {
                if (allNode.contains(node))
                {
                    return false;
                }
            }

            return true;
        });

        cache.commands = [];

        const deletedNodes: ClonableNode[] = [];

        filteredNodes.forEach((node) =>
        {
            const nodeId = node.id;
            const command = new RemoveChildCommand({ nodeId });

            cache.commands.push(command);

            const { nodes } = command.run();

            deletedNodes.push(...nodes);
        });

        return { nodes: deletedNodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            const command = commands[i];

            // ensure restore dependencies are available before reverting undo of single node
            this.getInstance(command.params.nodeId);

            command.undo();
        }
    }
}
