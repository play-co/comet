import { TextureAsset } from '../../core/assets/textureAsset';
import { Cache } from '../../core/cache';
import { getGlobalEmitter } from '../../core/events';
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
import type { DatastoreEvent } from '../events/datastoreEvents';
import type { DatastoreBase } from './datastoreBase';
import { getUserLogColor, getUserName } from './user';

const globalEmitter = getGlobalEmitter<DatastoreEvent>();

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle = 'color:cyan';

export class RemoteObjectSync
{
    constructor(public readonly datastore: DatastoreBase<any, any>)
    {
        globalEmitter
            .on('datastore.remote.node.created', this.onRemoteNodeCreated)
            .on('datastore.node.hydrated', this.onRemoteNodeCreated)
            .on('datastore.remote.node.removed', this.onRemoteNodeRemoved)
            .on('datastore.remote.node.parent.set', this.onRemoteNodeParentSet)
            .on('datastore.node.customProp.defined', this.onRemoteNodeCustomPropDefined)
            .on('datastore.remote.node.customProp.undefined', this.onRemoteNodeCustomPropUndefined)
            .on('datastore.remote.node.customProp.assigned', this.onRemoteNodeCustomPropAssigned)
            .on('datastore.remote.node.customProp.unassigned', this.onRemoteNodeCustomPropUnassigned)
            .on('datastore.remote.node.model.modified', this.onRemoteNodeModelModified)
            .on('datastore.remote.node.cloneInfo.modified', this.onRemoteNodeCloneInfoModified)
            .on('datastore.remote.node.children.set', this.onRemoteNodeChildrenSet)
            .on('datastore.texture.created', this.onTextureCreated);
    }

    protected log(eventName: string, event: any)
    {
        console.log(`%c${logId}:%c${eventName} ${JSON.stringify(event)}`, userColor, logStyle);
    }

    protected onRemoteNodeCreated = (event: DatastoreEvent['datastore.remote.node.created']) =>
    {
        const { nodeId } = event;

        this.log('onNodeCreated', event);

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

    protected onRemoteNodeRemoved = (event: DatastoreEvent['datastore.remote.node.removed']) =>
    {
        this.log('onNodeRemoved', event);

        const nodeId = event.nodeId;

        new RemoveNodeCommand({ nodeId }).run();
    };

    protected onRemoteNodeParentSet = (event: DatastoreEvent['datastore.remote.node.parent.set']) =>
    {
        this.log('onParentSet', event);

        const { nodeId, parentId } = event;

        new SetParentCommand({
            nodeId,
            parentId,
            updateMode: 'graphOnly',
        }).run();
    };

    protected onRemoteNodeCustomPropDefined = (event: DatastoreEvent['datastore.node.customProp.defined']) =>
    {
        this.log('onCustomPropDefined', event);

        const { nodeId, customKey, type, value } = event;

        new SetCustomPropCommand({ nodeId, customKey, type, value, updateMode: 'graphOnly' }).run();
    };

    protected onRemoteNodeCustomPropUndefined = (event: DatastoreEvent['datastore.remote.node.customProp.undefined']) =>
    {
        this.log('onCustomPropUndefined', event);

        const { nodeId, customKey } = event;

        new RemoveCustomPropCommand({ nodeId, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onRemoteNodeCustomPropAssigned = (event: DatastoreEvent['datastore.remote.node.customProp.assigned']) =>
    {
        this.log('onCustomPropAssigned', event);

        const { nodeId, modelKey, customKey } = event;

        new AssignCustomPropCommand({ nodeId, modelKey, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onRemoteNodeCustomPropUnassigned = (event: DatastoreEvent['datastore.remote.node.customProp.unassigned']) =>
    {
        this.log('onCustomPropUnassigned', event);

        const { nodeId, modelKey } = event;

        new UnAssignCustomPropCommand({ nodeId, modelKey, updateMode: 'graphOnly' }).run();
    };

    protected onRemoteNodeModelModified = (event: DatastoreEvent['datastore.remote.node.model.modified']) =>
    {
        this.log('onModelModified', event);

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

    protected onRemoteNodeCloneInfoModified = (event: DatastoreEvent['datastore.remote.node.cloneInfo.modified']) =>
    {
        this.log('onCloneInfoModified', event);

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

    protected onRemoteNodeChildrenSet = (event: DatastoreEvent['datastore.remote.node.children.set']) =>
    {
        const { nodeId, childIds } = event;
        const node = getInstance<GraphNode>(nodeId);

        node.reorderChildren(childIds);
    };

    protected onTextureCreated = (event: DatastoreEvent['datastore.texture.created']) =>
    {
        const texture = TextureAsset.withIdFromSchema(event.id, event);

        Cache.textures.add(texture);
    };
}
