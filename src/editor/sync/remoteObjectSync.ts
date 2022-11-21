import { TextureAsset } from '../../core/assets/textureAsset';
import { Cache } from '../../core/cache';
import { getGlobalEmitter } from '../../core/events';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { getInstance, hasInstance } from '../../core/nodes/instances';
import { AssignCustomPropCommand } from '../commands/assignCustomProp';
import { CreateNodeCommand } from '../commands/createNode';
import { RemoveCustomPropCommand } from '../commands/removeCustomProp';
import { RemoveNodeCommand } from '../commands/removeNode';
import { SetCustomPropCommand } from '../commands/setCustomProp';
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
            .on('datastore.remote.node.created', this.onNodeCreated)
            .on('datastore.node.hydrated', this.onNodeCreated)
            .on('datastore.remote.node.removed', this.onNodeRemoved)
            .on('datastore.remote.node.parent.set', this.onParentSet)
            .on('datastore.node.customProp.defined', this.onCustomPropDefined)
            .on('datastore.remote.node.customProp.undefined', this.onCustomPropUndefined)
            .on('datastore.remote.node.customProp.assigned', this.onCustomPropAssigned)
            .on('datastore.remote.node.customProp.unassigned', this.onCustomPropUnassigned)
            .on('datastore.remote.node.model.modified', this.onModelModified)
            .on('datastore.remote.node.cloneInfo.modified', this.onCloneInfoModified)
            .on('datastore.texture.created', this.onTextureCreated);
    }

    protected log(eventName: string, event: any)
    {
        console.log(`%c${logId}:%c${eventName} ${JSON.stringify(event)}`, userColor, logStyle);
    }

    protected onNodeCreated = (event: DatastoreEvent['datastore.remote.node.created']) =>
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

    protected onNodeRemoved = (event: DatastoreEvent['datastore.remote.node.removed']) =>
    {
        this.log('onNodeRemoved', event);

        const nodeId = event.nodeId;

        new RemoveNodeCommand({ nodeId }).run();
    };

    protected onParentSet = (event: DatastoreEvent['datastore.remote.node.parent.set']) =>
    {
        this.log('onParentSet', event);

        const { nodeId, parentId } = event;

        // update graph node
        const parentNode = getInstance<ClonableNode>(parentId);
        const childNode = getInstance<ClonableNode>(nodeId);

        if (parentNode.children.indexOf(childNode) === -1)
        {
            parentNode.addChild(childNode);
        }
    };

    protected onCustomPropDefined = (event: DatastoreEvent['datastore.node.customProp.defined']) =>
    {
        this.log('onCustomPropDefined', event);

        const { nodeId, customKey, type, value } = event;

        new SetCustomPropCommand({ nodeId, customKey, type, value, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropUndefined = (event: DatastoreEvent['datastore.remote.node.customProp.undefined']) =>
    {
        this.log('onCustomPropUndefined', event);

        const { nodeId, customKey } = event;

        new RemoveCustomPropCommand({ nodeId, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropAssigned = (event: DatastoreEvent['datastore.remote.node.customProp.assigned']) =>
    {
        this.log('onCustomPropAssigned', event);

        const { nodeId, modelKey, customKey } = event;

        new AssignCustomPropCommand({ nodeId, modelKey, customKey, updateMode: 'graphOnly' }).run();
    };

    protected onCustomPropUnassigned = (event: DatastoreEvent['datastore.remote.node.customProp.unassigned']) =>
    {
        this.log('onCustomPropUnassigned', event);

        const { nodeId, modelKey } = event;

        new UnAssignCustomPropCommand({ nodeId, modelKey, updateMode: 'graphOnly' }).run();
    };

    protected onModelModified = (event: DatastoreEvent['datastore.remote.node.model.modified']) =>
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

    protected onCloneInfoModified = (event: DatastoreEvent['datastore.remote.node.cloneInfo.modified']) =>
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

    protected onTextureCreated = (event: DatastoreEvent['datastore.texture.created']) =>
    {
        const texture = TextureAsset.withIdFromSchema(event.id, event);

        Cache.textures.add(texture);
    };
}
