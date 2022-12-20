import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneMode } from '../../core/nodes/cloneInfo';
import type { NodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';
import { CloneCommand } from './clone';
import { CreateNodeCommand } from './createNode';
import { RemoveChildCommand } from './removeChild';

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
    commands: RemoveChildCommand[];
}

export class AddChildCommand<
    M extends ModelBase = ModelBase,
> extends Command<AddChildCommandParams<M>, AddChildCommandReturn, AddChildCommandCache>
{
    public static commandName = 'AddChild';

    public apply(): AddChildCommandReturn
    {
        const { cache, params, params: { nodeSchema } } = this;

        const sourceNode = this.getInstance(params.parentId);
        const originalParentNode = sourceNode.getAddChildCloneTarget();
        const clonedParentNodes = originalParentNode.getClonedDescendants();

        nodeSchema.parent = originalParentNode.id;

        const { node } = new CreateNodeCommand({ nodeSchema }).run();
        const nodes: ClonableNode[] = [node];

        let lastCloneSource = node;

        clonedParentNodes.forEach((clonedParent) =>
        {
            const cloneMode = clonedParent.getNewChildCloneMode();

            const { clonedNode } = new CloneCommand({
                newParentId: clonedParent.id,
                nodeId: lastCloneSource.id,
                cloneMode,
                depth: 1,
            }).run();

            if (cloneMode === CloneMode.Variant)
            {
                lastCloneSource = clonedNode;
            }

            nodes.push(clonedNode);
        });

        // prepare cache
        cache.commands = nodes.map((node) => new RemoveChildCommand({ nodeId: node.id }));

        return { nodes };
    }

    public undo(): void
    {
        const { cache: { commands } } = this;

        for (let i = commands.length - 1; i >= 0; i--)
        {
            commands[i].apply();
        }
    }

    public redo(): void
    {
        const { cache: { commands } } = this;

        for (let i = 0; i < commands.length; i++)
        {
            commands[i].undo();
        }
    }
}
