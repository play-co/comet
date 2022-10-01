import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import { getInstance, newId } from '../../core/nodes/instances';
import type { NodeSchema } from '../../core/nodes/schema';
import { Command } from '../command';
import { CloneCommand } from './clone';
import { CreateNodeCommand } from './createNode';
import { RemoveNodeCommand } from './removeNode';
import { SetParentCommand } from './setParent';

export interface AddChildCommandParams<M extends ModelBase>
{
    parentId: string;
    nodeSchema: NodeSchema<M>;
}

export interface AddChildCommandReturn
{
    nodes: ClonableNode[];
}

export interface AddChildCommandCache
{
    nodes: string[];
}

export class AddChildCommand<
    M extends ModelBase = ModelBase,
> extends Command<AddChildCommandParams<M>, AddChildCommandReturn, AddChildCommandCache>
{
    public static commandName = 'AddChild';

    public apply(): AddChildCommandReturn
    {
        const { cache, params: { parentId, nodeSchema }, hasRun } = this;

        if (hasRun)
        {
            const newNodeId = newId(nodeSchema.type);
            const oldNodeId = nodeSchema.id;

            this.updateAllFollowingCommands((command) => command.updateNodeId(oldNodeId, newNodeId));
        }

        const sourceNode = getInstance<ClonableNode>(parentId);
        const originalParentNode = sourceNode.getAddChildCloneTarget();
        const clonedParentNodes = originalParentNode.getClonedDescendants();

        const { node } = new CreateNodeCommand({ nodeSchema, isNewNode: true }).run();
        const nodes: ClonableNode[] = [node];
        let lastCloneSource = node;

        new SetParentCommand({ parentId: originalParentNode.id, nodeId: node.id }).run();

        clonedParentNodes.forEach((clonedParent) =>
        {
            const cloneMode = clonedParent.getNewChildCloneMode();

            const { clonedNode } = new CloneCommand({
                nodeId: lastCloneSource.id,
                cloneMode,
                depth: 1,
            }).run();

            if (cloneMode === CloneMode.Variant)
            {
                lastCloneSource = clonedNode;
            }

            nodes.push(clonedNode);

            new SetParentCommand({ parentId: clonedParent.id, nodeId: clonedNode.id }).run();
        });

        cache.nodes = nodes.map((node) => node.id);

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { nodes } } = this;

        for (let i = nodes.length - 1; i >= 0; i--)
        {
            const id = nodes[i];

            new RemoveNodeCommand({ nodeId: id, updateMode: 'full' }).run();
        }
    }

    public updateNodeId(oldNodeId: string, newNodeId: string): void
    {
        super.updateNodeId(oldNodeId, newNodeId);

        const { cache } = this;

        cache.nodes = cache.nodes.map((nodeId) => (nodeId === oldNodeId ? newNodeId : nodeId));
    }
}
