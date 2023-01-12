import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { GraphNode } from '../../core/nodes/abstract/graphNode';
import { type NodeSchema, getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';
import Events from '../events';
import { CloneCommand } from './clone';
import { CreateNodeCommand } from './createNode';
import { RemoveChildCommand } from './removeChild';

export interface CreateChildCommandParams<M extends ModelBase>
{
    parentId: string;
    nodeSchema: NodeSchema<M>;
}

export interface CreateChildCommandReturn
{
    nodes: ClonableNode[];
    initialNode: ClonableNode;
}

export interface CreateChildCommandCache
{
    commands: RemoveChildCommand[];
}

export class CreateChildCommand<
    M extends ModelBase = ModelBase,
> extends Command<CreateChildCommandParams<M>, CreateChildCommandReturn, CreateChildCommandCache>
{
    public static commandName = 'CreateChild';

    public apply(): CreateChildCommandReturn
    {
        const { datastore, cache, params: { nodeSchema, parentId } } = this;

        const nodes: ClonableNode[] = [];
        const sourceParentNode = this.getInstance(parentId);
        const cloneTarget = sourceParentNode.getAddChildCloneTarget();
        const clonedParentDescendants = cloneTarget.getClonedDescendants();
        const newChildByParent = new Map<ClonableNode, ClonableNode>();

        // find the clone target and create initial node

        nodeSchema.parent = cloneTarget.id;

        const { node: initialNode } = new CreateNodeCommand({ nodeSchema, updateMode: 'graphOnly' }).run();

        nodes.push(initialNode);
        newChildByParent.set(cloneTarget, initialNode);

        clonedParentDescendants.forEach((cloneDescendant) =>
        {
            const cloneMode = cloneDescendant.getAddChildCloneMode();

            const { clonedNode } = new CloneCommand({
                nodeId: initialNode.id,
                newParentId: cloneDescendant.id,
                cloneMode,
                depth: 1,
                updateMode: 'graphOnly',
            }).run();

            newChildByParent.set(cloneDescendant, clonedNode);

            nodes.push(clonedNode);
        });

        // update the node clone details

        initialNode.cloneInfo.cloned = [];

        nodes.forEach((clonedNode) =>
        {
            const parentNode = clonedNode.getParent<ClonableNode>();
            const parentCloneTarget = parentNode.getCloneTarget();
            const targetNode = newChildByParent.get(parentCloneTarget) as ClonableNode;

            if (targetNode === clonedNode)
            {
                if (clonedNode.cloneInfo.isClone)
                {
                    const parentCloner = parentCloneTarget.cloneInfo.getCloner<ClonableNode>();

                    if (parentCloner)
                    {
                        // variant case, update nodes clone info
                        const targetNode = newChildByParent.get(parentCloner) as ClonableNode;

                        // targetNode.cloneInfo.cloned.push(clonedNode);
                        clonedNode.setClonerAsReference(targetNode);
                    }
                    else
                    {
                        throw new Error('No cloner found');
                    }
                }
            }
            else
            {
                // reference case, update nodes clone info
                clonedNode.setClonerAsReference(targetNode);
            }
        });

        // update model hierarchy

        const models: GraphNode[] = [initialNode.model];

        models.push(...initialNode.model.children);

        initialNode.model.children = [];

        for (let i = models.length - 1; i > 0; i--)
        {
            const child = models[i];
            const parent = models[i - 1];

            child.parent = parent;
            if (parent.children.indexOf(child) === -1)
            {
                parent.children.push(child);
            }
        }

        // update datastore, create nodes which are currently graphOnly

        nodes.forEach((node) =>
        {
            const schema = getNodeSchema(node);
            const { cloneInfo } = node;
            let model = schema.model;

            if (cloneInfo.isReference)
            {
                model = {};
            }
            else if (cloneInfo.isVariant)
            {
                model = node.model.ownValues;
            }

            schema.model = model;

            datastore.createNode(schema);

            Events.datastore.node.local.created.emit({ nodeId: node.id });
        });

        // prepare cache
        cache.commands = nodes.map((node) => new RemoveChildCommand({ nodeId: node.id }));

        return { nodes, initialNode };
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
