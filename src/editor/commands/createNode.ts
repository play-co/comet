import type { ModelBase } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { CloneInfo } from '../../core/nodes/cloneInfo';
import { getInstance, hasInstance } from '../../core/nodes/instances';
import { createNode } from '../../core/nodes/nodeFactory';
import type { NodeSchema } from '../../core/nodes/schema';
import { Command } from '../core/command';
import Events from '../events';
import { AssignCustomPropCommand } from './assignCustomProp';
import { SetCustomPropCommand } from './setCustomProp';

export interface CreateNodeCommandParams<M extends ModelBase>
{
    nodeSchema: NodeSchema<M>;
    deferCloneInfo?: boolean;
}

export interface CreateNodeCommandReturn
{
    node: ClonableNode;
}

export class CreateNodeCommand<
    M extends ModelBase = ModelBase,
> extends Command<CreateNodeCommandParams<M>, CreateNodeCommandReturn>
{
    public static commandName = 'CreateNode';

    public apply(): CreateNodeCommandReturn
    {
        const { datastore, params: { nodeSchema, deferCloneInfo } } = this;

        const { id, type, model, cloneInfo: { cloneMode, cloner }, customProperties } = nodeSchema;
        const cloneInfo = deferCloneInfo === true
            ? new CloneInfo(cloneMode)
            : new CloneInfo(cloneMode, cloner ? this.getInstance(cloner) : undefined);

        if (!datastore.hasNode(id))
        {
            // create datastore entry
            datastore.createNode(nodeSchema);
        }
        else
        {
            // just register the model, we are loading existing nodes
            datastore.registerNode(id);
        }

        const node = createNode<ClonableNode>(type, { id, model, cloneInfo });

        node.created = nodeSchema.created;

        if (deferCloneInfo)
        {
            node.deferredCloner = cloner;
        }

        if (nodeSchema.parent && hasInstance(nodeSchema.parent))
        {
            const parentNode = getInstance<ClonableNode>(nodeSchema.parent);

            parentNode.addChild(node);
        }

        // build defined custom properties
        for (const [customKey, definedProp] of Object.entries(customProperties.defined))
        {
            const { type, value } = definedProp;

            new SetCustomPropCommand({ nodeId: nodeSchema.id, customKey, type, value, updateMode: 'graphOnly' }).run();
        }

        // build assigned custom properties
        for (const [modelKey, customKey] of Object.entries(customProperties.assigned))
        {
            new AssignCustomPropCommand({ nodeId: nodeSchema.id, modelKey, customKey, updateMode: 'graphOnly' }).run();
        }

        Events.datastore.node.local.created.emit({ nodeId: node.id });

        return { node };
    }

    public undo(): void
    {
        throw new Error('Unimplemented');
    }
}
