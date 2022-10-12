import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { sortNodesByCreation } from '../../core/nodes/abstract/graphNode';
import { Command } from '../command';
import { RemoveNodeCommand } from './removeNode';

export interface RemoveChildCommandParams
{
    nodeId: string;
}

export interface RemoveChildCommandReturn
{
    nodes: ClonableNode[];
}

export interface RemoveChildCommandCache
{
    commands: RemoveNodeCommand[];
}

export class RemoveChildCommand
    extends Command<RemoveChildCommandParams, RemoveChildCommandReturn, RemoveChildCommandCache>
{
    public static commandName = 'RemoveChild';

    public apply(): RemoveChildCommandReturn
    {
        const { cache, datastore, params: { nodeId } } = this;

        const sourceNode = this.getInstance(nodeId);
        const originalNode = sourceNode.getModificationCloneTarget();
        const dependantNodes = originalNode.getDependants().filter((node) => !node.isCloaked);

        const nodes: ClonableNode[] = [originalNode, ...dependantNodes];

        cache.commands = [];

        nodes.sort(sortNodesByCreation).reverse();

        datastore.batch(() =>
        {
            nodes.forEach((node) =>
            {
                const command = new RemoveNodeCommand({ nodeId: node.id });

                cache.commands.push(command);
                command.run();
            });
        });

        const clonerNodesNeedingUpdate = nodes.filter((node) =>
            node.cloneInfo.cloner
        && datastore.hasNodeElement(node.id))
            .map((node) => [node, node.cloneInfo.getCloner<ClonableNode>()]);

        if (clonerNodesNeedingUpdate.length > 0)
        {
            datastore.batch(() =>
            {
                clonerNodesNeedingUpdate.forEach((nodeWithCloner) =>
                {
                    const [node, cloner] = nodeWithCloner;
                    const cloneInfoSchema = cloner.cloneInfo.clone().removeCloned(node).toSchema();

                    datastore.updateNodeCloneInfo(cloner.id, cloneInfoSchema);
                });
            });
        }

        return { nodes };
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
