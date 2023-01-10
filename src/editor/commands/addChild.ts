import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { GraphNode } from '../../core/nodes/abstract/graphNode';
import { type NodeSchema, getNodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';
import Events from '../events';
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
        const { datastore, cache, params, params: { nodeSchema } } = this;

        const nodes: ClonableNode[] = [];
        const sourceNode = this.getInstance(params.parentId);
        const cloneTarget = sourceNode.getAddChildCloneTarget();
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
            const cloner = clonedNode.cloneInfo.getCloner<ClonableNode>();

            console.log('?', clonedNode.id, clonedNode.cloneInfo.cloner?.id);

            if (targetNode !== clonedNode)
            {
                // update nodes clone info
                clonedNode.setClonerAsReference(targetNode);
            }

            if (cloner && !cloner.cloneInfo.cloned.includes(clonedNode))
            {
                // cloner.cloneInfo.cloned.push(clonedNode);
                console.log('addCloned', cloner.id, clonedNode.id);
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
