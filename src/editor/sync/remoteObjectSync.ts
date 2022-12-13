import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { GraphNode } from '../../core/nodes/abstract/graphNode';
import { getInstance, hasInstance } from '../../core/nodes/instances';
import { AssignCustomPropCommand } from '../commands/assignCustomProp';
import { CreateNodeCommand } from '../commands/createNode';
import { RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { RemoveNodeCommand } from '../commands/removeNode';
import { SetCustomPropCommand } from '../commands/setCustomProp';
import { SetParentCommand } from '../commands/setParent';
import { UnAssignCustomPropCommand } from '../commands/unassignCustomProp';
import Events from '../events';
import type { DatastoreBase } from './datastoreBase';

export class RemoteObjectSync
{
    constructor(public readonly datastore: DatastoreBase<any, any>)
    {
        Events.datastore.node.local.hydrated.bind(this.onNodeCreated);
        Events.datastore.node.remote.created.bind(this.onNodeCreated);
        Events.datastore.node.remote.removed.bind(this.onRemoteNodeRemoved);
        Events.datastore.node.remote.setParent.bind(this.onRemoteNodeParentSet);
        Events.datastore.node.remote.customProp.defined.bind(this.onRemoteNodeCustomPropDefined);
        Events.datastore.node.remote.customProp.undefined.bind(this.onRemoteNodeCustomPropUndefined);
        Events.datastore.node.remote.customProp.assigned.bind(this.onRemoteNodeCustomPropAssigned);
        Events.datastore.node.remote.customProp.unassigned.bind(this.onRemoteNodeCustomPropUnassigned);
        Events.datastore.node.remote.modelModified.bind(this.onRemoteNodeModelModified);
        Events.datastore.node.remote.cloneInfoModified.bind(this.onRemoteNodeCloneInfoModified);
        Events.datastore.node.remote.setChildren.bind(this.onRemoteNodeChildrenSet);
    }

    protected onNodeCreated = (event: typeof Events.datastore.node.remote.created.type) =>
    {
        const { nodeId } = event;

        if (hasInstance(nodeId) && getInstance<ClonableNode>(nodeId).isCloaked)
        {
            getInstance<ClonableNode>(nodeId).uncloak();
        }
        else
        {
            const nodeSchema = this.datastore.getNodeAsJSON(event.nodeId);

            new CreateNodeCommand({ nodeSchema }).run();
        }
    };

    protected onRemoteNodeRemoved = (event: typeof Events.datastore.node.remote.removed.type) =>
    {
        const nodeId = event.nodeId;

        new RemoveNodeCommand({ nodeId }).run();
    };

    protected onRemoteNodeParentSet = (event: typeof Events.datastore.node.remote.setParent.type) =>
    {
        const { nodeId, parentId } = event;

        new SetParentCommand({
            nodeId,
            parentId,
            updateMode: 'graphOnly',
        }).run();
    };

    protected onRemoteNodeCustomPropDefined = (event: typeof Events.datastore.node.remote.customProp.defined.type) =>
    {
        const { nodeId, customKey, type, value } = event;

        new SetCustomPropCommand({ nodeId, customKey, type, value, updateMode: 'graphOnly' }).run();
    };

    protected onRemoteNodeCustomPropUndefined = (event: typeof Events.datastore.node.remote.customProp.undefined.type) =>
    {
        const { nodeId, customKey } = event;

        new RemoveCustomPropCommand({ nodeId, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onRemoteNodeCustomPropAssigned = (event: typeof Events.datastore.node.remote.customProp.assigned.type) =>
    {
        const { nodeId, modelKey, customKey } = event;

        new AssignCustomPropCommand({ nodeId, modelKey, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onRemoteNodeCustomPropUnassigned = (event: typeof Events.datastore.node.remote.customProp.unassigned.type) =>
    {
        const { nodeId, modelKey } = event;

        new UnAssignCustomPropCommand({ nodeId, modelKey, updateMode: 'graphOnly' }).run();
    };

    protected onRemoteNodeModelModified = (event: typeof Events.datastore.node.remote.modelModified.type) =>
    {
        const { key, nodeId, value } = event;

        const node = getInstance<ClonableNode>(nodeId);

        if (key === null)
        {
            // whole object was passed as value
            node.model.setValues(value as object);
        }
        else
        {
            // individual key
            node.model.setValue(key, value);
        }
    };

    protected onRemoteNodeCloneInfoModified = (event: typeof Events.datastore.node.remote.cloneInfoModified.type) =>
    {
        const { nodeId, cloner, cloneMode, cloned } = event;

        const node = getInstance<ClonableNode>(nodeId);
        const cloneInfo = node.cloneInfo;

        // remove from existing cloners .cloned info
        if (cloneInfo.cloner)
        {
            cloneInfo.cloner.cloneInfo.removeCloned(node);
        }

        // set new cloner
        if (cloner)
        {
            const clonerNode = getInstance<ClonableNode>(cloner);

            clonerNode.cloneInfo.cloned.push(node);
            cloneInfo.cloner = clonerNode;
        }
        else
        {
            delete cloneInfo.cloner;
        }

        // overwrite cloneMode and cloners
        cloneInfo.cloneMode = cloneMode;
        cloneInfo.cloned = cloned.map((clonedId) => getInstance<ClonableNode>(clonedId));
    };

    protected onRemoteNodeChildrenSet = (event: typeof Events.datastore.node.remote.setChildren.type) =>
    {
        const { nodeId, childIds } = event;
        const node = getInstance<GraphNode>(nodeId);

        node.reorderChildren(childIds);
    };
}
