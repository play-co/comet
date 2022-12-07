import Convergence, {
    type ConvergenceDomain,
    type IConvergenceEvent,
    type ObjectSetEvent,     type RealTimeModel,
    RealTimeArray,
    RealTimeObject,
} from '@convergence/convergence';

import { TextureAsset } from '../../core/assets/textureAsset';
import { Cache } from '../../core/cache';
import type { ModelValue } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import { consolidateId, getInstance } from '../../core/nodes/instances';
import type {
    CloneInfoSchema,
    NodeSchema,
    ProjectSchema,
    TextureAssetSchema,
} from '../../core/nodes/schema';
import { createProjectSchema } from '../../core/nodes/schema';
import { Application } from '../core/application';
import Events from '../events';
import { DatastoreBase } from './datastoreBase';
import { getUserLogColor, getUserName } from './user';

const userName = getUserName();
const logStyle = 'color:LimeGreen';
const userColor = getUserLogColor(userName);
const logId = `${userName}`;

export const defaultProjectModelSettings = {
    collection: 'projects',
    overrideCollectionWorldPermissions: false,
    ephemeral: false,
    worldPermissions: { read: true, write: true, remove: true, manage: true },
};

export const connectionTimeout = 2500;

function asObjectSetEvent(e: IConvergenceEvent)
{
    // note, this helper function is only useful for events on RealTimeObjects, arrays need different casting
    const event = e as ObjectSetEvent;
    const nodeElement = event.element as RealTimeObject;
    const nodeId = nodeElement.get('id').value() as string;

    return { event, nodeElement, nodeId };
}

export class ConvergenceDatastore extends DatastoreBase<RealTimeObject, IConvergenceEvent>
{
    protected _domain?: ConvergenceDomain;
    protected _model?: RealTimeModel;

    // general public API

    public connect(): Promise<void>
    {
        return new Promise((resolve, reject) =>
        {
            const url = 'https://localhost/realtime/~admin/local';

            const timeout = setTimeout(() =>
            {
                reject(new Error(`Connection timeout`));
            }, connectionTimeout);

            Convergence.connect(url, userName, 'password', {
                connection: {
                    connectionRequestTimeout: connectionTimeout,
                    timeout: connectionTimeout,
                },
                models: {
                    data: {
                        undefinedObjectValues: 'omit',
                        undefinedArrayValues: 'null',
                    },
                },
            }).then((domain) =>
            {
                console.log(`%c${logId}:%cConnected as "${userName}"`, userColor, logStyle);

                clearTimeout(timeout);
                this._domain = domain;
                resolve();
            }).catch(reject);
        });
    }

    public async disconnect()
    {
        if (!this.domain.isDisposed())
        {
            await this.domain.disconnect();
            await this.domain.dispose();
            console.log(`%c${logId}:%cDomain disposed`, userColor, logStyle);
        }
    }

    public async batch(fn: () => void)
    {
        this.model.startBatch();
        fn();
        this.model.completeBatch();
    }

    public registerNode(nodeId: string)
    {
        const nodeElement = this.nodes.get(nodeId) as RealTimeObject;

        if (!nodeElement)
        {
            throw new Error(`${logId}:Existing node "${nodeId}" RealTimeObject not found, cannot track.`);
        }

        if (!this.nodeProxies.has(nodeId))
        {
            // index element
            this.nodeProxies.set(nodeId, nodeElement);

            // track remote changes
            this.initNodeRemoteEvents(nodeId);
        }
    }

    public hasNode(nodeId: string)
    {
        return this.nodes.hasKey(nodeId);
    }

    public hasRegisteredNode(nodeId: string)
    {
        return this.nodeProxies.has(nodeId);
    }

    public getNodeAsJSON(nodeId: string)
    {
        const nodeElement = this.getNodeElement(nodeId);

        return nodeElement.toJSON() as NodeSchema;
    }

    public async createProject(name: string, id?: string)
    {
        const data = createProjectSchema(name);

        const model = await this.domain.models().openAutoCreate({
            ...defaultProjectModelSettings,
            id,
            data,
        });

        console.log(`%c${logId}:%cCreated project "${model.modelId()}"`, userColor, logStyle);

        return await this.openProject(model.modelId());
    }

    public async openProject(id: string): Promise<ClonableNode>
    {
        const model = await this.domain.models().open(id);

        console.log(`%c${logId}:%cOpened project "${model.modelId()}"`, userColor, logStyle);

        this._model = model;

        await this.joinActivity('editProject', model.modelId());

        // catch events when a remote user adds or removes a node...
        this.nodes
            .on(RealTimeObject.Events.SET, this.onRemoteNodeCreated)
            .on(RealTimeObject.Events.REMOVE, this.onRemoteNodeRemoved);

        // catch events for assets
        this.textures
            .on(RealTimeObject.Events.SET, this.onTextureCreated)
            .on(RealTimeObject.Events.REMOVE, this.onTextureRemoved);

        return this.hydrate();
    }

    public async hasProject(name: string)
    {
        const results = await this.domain.models()
            .query(`SELECT * FROM projects WHERE name = '${name}'`);

        if (results.totalResults > 0)
        {
            return true;
        }

        return false;
    }

    public async closeProject()
    {
        if (this._model)
        {
            await this._model.close();
            delete this._model;
        }
    }

    public async deleteProject(id: string)
    {
        await this.domain.models().remove(id);

        console.log(`%c${logId}:%cDelete project "${id}"`, userColor, logStyle);
    }

    public hydrate()
    {
        const { nodes, textures } = this;

        // index all nodeElements
        nodes.keys().forEach((id) =>
        {
            const nodeElement = nodes.get(id) as RealTimeObject;

            this.registerExistingNode(id, nodeElement);
        });

        // get the root
        const rootId = this.model.root().get('root').value() as string;
        const projectNode = nodes.get(rootId) as RealTimeObject;

        if (projectNode)
        {
            // hydrate textures
            textures.keys().forEach((id) =>
            {
                const textureElement = textures.get(id) as RealTimeObject;

                const schema = {
                    id,
                    ...textureElement.toJSON(),
                };

                consolidateId(id);

                console.log(`%c${logId}:%cHydrate Texture Asset "${id}"`, userColor, logStyle);

                Events.datastore.texture.created.emit(schema);
            });

            // start hydrating from the root node (Project)
            this.hydrateElement(projectNode);
        }
        else
        {
            throw new Error(`${logId}:Could not find project node`);
        }

        return getInstance<ClonableNode>(rootId);
    }

    public reset()
    {
        this.nodeProxies.clear();

        delete this._model;
    }

    public toProjectSchema()
    {
        return this.model.root().toJSON() as ProjectSchema;
    }

    // command API

    public createNode(nodeSchema: NodeSchema)
    {
        console.log(
            `%c${logId}:%c🟩 createNode() nodeId: "${nodeSchema.id}" %c${JSON.stringify(nodeSchema)}`,
            userColor,
            logStyle,
            'color:#999',
        );

        if (this.nodes.hasKey(nodeSchema.id))
        {
            throw new Error(`${logId}:Node "${nodeSchema.id}" node already registered.`);
        }

        const nodeElement = this.nodes.set(nodeSchema.id, nodeSchema) as RealTimeObject;

        this.registerExistingNode(nodeSchema.id, nodeElement);

        if (nodeSchema.parent)
        {
            this.setNodeParent(nodeSchema.id, nodeSchema.parent);
        }

        Events.datastore.node.local.created.emit({ nodeId: nodeSchema.id });
    }

    public removeNode(nodeId: string)
    {
        console.log(
            `%c${logId}:%c🟩 removeNode() nodeId: ${nodeId}`,
            userColor,
            logStyle,
        );

        const nodeElement = this.getNodeElement(nodeId);
        const parentId = nodeElement.get('parent').value() as string | undefined;

        // remove from nodes RealTimeObject
        this.nodes.remove(nodeId);

        if (parentId)
        {
            // remove child reference in parent element
            const parentElement = this.getNodeElement(parentId);
            const childArray = parentElement.get('children') as RealTimeArray;
            const index = childArray.findIndex((id) => id.value() === nodeId);

            if (index === -1)
            {
                throw new Error(`${logId}:Could not find child "${nodeId}" reference in parent "${parentId}"`);
            }

            childArray.remove(index);
        }

        // unregister RealTimeObject for node
        this.unRegisterNode(nodeId);
    }

    public setNodeParent(childId: string, parentId: string)
    {
        console.log(
            `%c${logId}:%c🟩 setNodeParent() childId: ${childId} parentId: ${parentId}`,
            userColor,
            logStyle,
        );

        const parentElement = this.getNodeElement(parentId);
        const childElement = this.getNodeElement(childId);
        const prevParentId = childElement.get('parent').value() as string;
        const prevParentElement = this.hasNode(prevParentId) ? this.getNodeElement(prevParentId) : undefined;

        // remove from previous parents children first
        if (prevParentElement)
        {
            const childArray = prevParentElement.get('children') as RealTimeArray;
            const index = childArray.findIndex((id) => id.value() === childId);

            if (index > -1)
            {
                childArray.remove(index);
            }
        }

        // set parent data
        childElement.set('parent', this.assertValue(parentId));

        // set children data if not present
        const childArray = parentElement.get('children') as RealTimeArray;
        const index = childArray.findIndex((id) => id.value() === childId);

        if (index === -1)
        {
            childArray.push(childId);
        }
    }

    public modifyNodeModel(nodeId: string, values: object)
    {
        console.log(
            `%c${logId}:%c🟩 modifyNodeModel() nodeId: ${nodeId} values: ${JSON.stringify(values)}`,
            userColor,
            logStyle,
        );

        const nodeElement = this.getNodeElement(nodeId);
        const modelElement = nodeElement.get('model') as RealTimeObject;

        const entries = Object.entries(values);

        if (entries.length > 0)
        {
            this.batch(() =>
            {
                for (const [k, v] of entries)
                {
                    const value = this.assertValue(v);

                    modelElement.set(k, value);
                }
            });
        }
    }

    public updateNodeCloneInfo(nodeId: string, cloneInfoSchema: CloneInfoSchema)
    {
        console.log(
            `%c${logId}:%c🟩 updateNodeCloneInfo() nodeId: ${nodeId} cloneInfoSchema: ${JSON.stringify(cloneInfoSchema)}`,
            userColor,
            logStyle,
        );

        const nodeElement = this.getNodeElement(nodeId);

        nodeElement.get('cloneInfo').value(cloneInfoSchema);
    }

    public setCustomProperty(
        nodeId: string,
        customKey: string,
        type: CustomPropertyType,
        value: CustomPropertyValueType | undefined,
    )
    {
        const nodeElement = this.getNodeElement(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        definedCustomProps.set(customKey, {
            type,
            value: this.assertValue(value),
        });
    }

    public removeCustomProperty(nodeId: string, customKey: string)
    {
        const nodeElement = this.getNodeElement(nodeId);
        const definedCustomProps = nodeElement.elementAt('customProperties', 'defined') as RealTimeObject;

        definedCustomProps.remove(customKey);
    }

    public assignCustomProperty(nodeId: string, modelKey: string, customKey: string)
    {
        const nodeElement = this.getNodeElement(nodeId);
        const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

        assignedCustomProps.set(modelKey, this.assertValue(customKey));
    }

    public unassignCustomProperty(nodeId: string, modelKey: string)
    {
        const nodeElement = this.getNodeElement(nodeId);
        const assignedCustomProps = nodeElement.elementAt('customProperties', 'assigned') as RealTimeObject;

        assignedCustomProps.remove(modelKey);
    }

    public setNodeChildren(nodeId: string, childIds: string[])
    {
        const nodeElement = this.getNodeElement(nodeId);

        const childArray = nodeElement.get('children') as RealTimeArray;

        childArray.value(childIds);
    }

    // remote change event handles

    public onRemoteNodeCreated = (e: IConvergenceEvent) =>
    {
        const { event } = asObjectSetEvent(e);
        const nodeElement = event.value as RealTimeObject;
        const nodeId = nodeElement.get('id').value() as string;

        consolidateId(nodeId);

        console.log(
            `%c${logId}:%c🟦 onNodeCreated: nodeId: "${nodeId}" %c${JSON.stringify(nodeElement.toJSON())}`,
            userColor,
            logStyle,
            'color:#999',
        );

        this.registerExistingNode(nodeId, nodeElement);

        Events.datastore.node.remote.created.emit({ nodeId });
    };

    public onRemoteNodeRemoved = (e: IConvergenceEvent) =>
    {
        const { event } = asObjectSetEvent(e);
        const nodeId = event.key;
        const nodeElement = event.oldValue as RealTimeObject;
        const parentId = nodeElement.get('parent').value() as string | undefined;

        console.log(`%c${logId}:%c🟦 onNodeRemoved: "${nodeId}"`, userColor, logStyle);

        this.unRegisterNode(nodeId);

        Events.datastore.node.remote.removed.emit({ nodeId, parentId });
    };

    public onRemoteNodeRootPropertySet = (e: IConvergenceEvent) =>
    {
        const { event, nodeId } = asObjectSetEvent(e);
        const key = event.key;

        if (key === 'parent')
        {
            const parentId = event.value.value();
            const oldParentId = event.oldValue.value();

            console.log(
                `%c${logId}:%c🟦 onNodeRootPropertySet["parent"]: parentId: "${parentId}" 
                childId: "${nodeId}" oldParentId: "${oldParentId}"`, userColor, logStyle,
            );

            Events.datastore.node.remote.setParent.emit({ parentId, nodeId });
        }
    };

    public onRemoteNodeDefinedCustomPropSet = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = asObjectSetEvent(e);
        const nodeId = (nodeElement.parent().parent() as RealTimeObject).get('id').value() as string;
        const customKey = event.key;
        const element = event.value as RealTimeObject;
        const { type, value } = element.toJSON();
        const info = JSON.stringify(element.toJSON());

        console.log(`%c${logId}:%c🟦 onNodeDefinedCustomPropSet: nodeId: "${nodeId}" info: ${info}`, userColor, logStyle);

        Events.datastore.node.remote.customProp.defined.emit({ nodeId, customKey, type, value });
    };

    public onRemoteNodeDefinedCustomPropRemoved = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = asObjectSetEvent(e);
        const nodeId = (nodeElement.parent().parent() as RealTimeObject).get('id').value() as string;
        const customKey = event.key;

        console.log(
            `%c${logId}:%c🟦 onNodeDefinedCustomPropRemoved: nodeId: "${nodeId}" customKey: "${customKey}"`,
            userColor,
            logStyle,
        );

        Events.datastore.node.remote.customProp.undefined.emit({ nodeId, customKey });
    };

    public onRemoteNodeAssignedCustomPropSet = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = asObjectSetEvent(e);
        const nodeId = (nodeElement.parent().parent() as RealTimeObject).get('id').value() as string;
        const modelKey = event.key;
        const customKey = event.value.value() as string;

        console.log(
            `%c${logId}:%c🟦 onNodeAssignedCustomPropSet: nodeId: "${nodeId}" modelKey: "${modelKey}->${customKey}"`,
            userColor,
            logStyle,
        );

        Events.datastore.node.remote.customProp.assigned.emit({ nodeId, modelKey, customKey });
    };

    public onRemoteNodeAssignedCustomPropRemoved = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = asObjectSetEvent(e);
        const nodeId = (nodeElement.parent().parent() as RealTimeObject).get('id').value() as string;
        const modelKey = event.key;

        console.log(`%c${logId}:%c🟦 onNodeAssignedCustomPropRemoved: nodeId: "${nodeId}" modelKey "${modelKey}"`,
            userColor,
            logStyle,
        );

        Events.datastore.node.remote.customProp.unassigned.emit({ nodeId, modelKey });
    };

    public onRemoteNodeModelPropertySet = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = asObjectSetEvent(e);
        const nodeId = (nodeElement.parent() as RealTimeObject).get('id').value() as string;
        const key = event.key;
        const value = event.value.value() as ModelValue;

        const node = getInstance<ClonableNode>(nodeId);
        const values = node.model.values;

        if (value !== values[key])
        {
            console.log(
                `%c${logId}:%c🟦 onNodeModelPropertySet: nodeId: "${nodeId}" key: "${key}" value: "${value}"`,
                userColor,
                logStyle,
            );

            Events.datastore.node.remote.modelModified.emit({ nodeId, key, value });
        }
    };

    public onRemoteNodeModelValueSet = (e: IConvergenceEvent) =>
    {
        const { event, nodeId } = asObjectSetEvent(e);
        const model = event.element.value() as object;

        console.log(`%c${logId}:%c🟦 onNodeModelValueSet: nodeId: "${nodeId}" ${JSON.stringify(model)}`, userColor, logStyle);

        Events.datastore.node.remote.modelModified.emit({ nodeId, key: null, value: model });
    };

    public onRemoteNodeModelPropertyRemove = (e: IConvergenceEvent) =>
    {
        throw new Error(`${logId}:Model REMOVED event not supported yet ${e.name}`);
    };

    public onRemoteNodeCloneInfoValueSet = (e: IConvergenceEvent) =>
    {
        const { event, nodeElement } = asObjectSetEvent(e);
        const nodeId = (nodeElement.parent() as RealTimeObject).get('id').value() as string;
        const cloneInfo = event.element.value() as CloneInfoSchema;

        console.log(
            `%c${logId}:%c:🟦 onNodeCloneInfoValueSet: nodeId: "${nodeId}" ${JSON.stringify(cloneInfo)}`,
            userColor,
            logStyle,
        );

        Events.datastore.node.remote.cloneInfoModified.emit({ nodeId, ...cloneInfo });
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTextureCreated = (e: IConvergenceEvent) =>
    {
        const { event } = asObjectSetEvent(e);
        const id = event.key;
        const schema = (event.element.value())[id] as TextureAssetSchema;

        consolidateId(id);

        const texture = TextureAsset.withIdFromSchema(id, schema);

        Cache.textures.add(texture);
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onTextureRemoved = (event: IConvergenceEvent) =>
    {
        //
    };

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onRemoteChildrenSet = (e: IConvergenceEvent) =>
    {
        const event = e as ObjectSetEvent;
        const array = event.element as unknown as RealTimeArray;
        const parent = array.parent() as RealTimeObject;
        const nodeId = parent.get('id').value();

        Events.datastore.node.remote.setChildren.emit({ nodeId, childIds: array.toJSON() });
    };

    public getRegisteredIds()
    {
        return Array.from(this.nodeProxies.keys());
    }

    public setNodesData(data: Record<string, NodeSchema>)
    {
        this.nodes.value(data);
    }

    public getNodeElement(id: string)
    {
        const nodeElement = this.nodeProxies.get(id);

        if (!nodeElement)
        {
            throw new Error(`${logId}:Node "${id}" RealTimeObject not registered.`);
        }

        return nodeElement;
    }

    protected get app()
    {
        return Application.instance;
    }

    protected get domain()
    {
        if (!this._domain)
        {
            throw new Error(`${logId}:Domain not found`);
        }

        return this._domain;
    }

    protected get model()
    {
        if (!this._model)
        {
            throw new Error(`${logId}:Datastore model not initialised`);
        }

        return this._model;
    }

    protected get nodes()
    {
        return this.model.elementAt('nodes') as RealTimeObject;
    }

    protected get assets()
    {
        return this.model.elementAt('assets') as RealTimeObject;
    }

    protected get textures()
    {
        return this.assets.elementAt('textures') as RealTimeObject;
    }

    protected assertValue(value: unknown)
    {
        if (typeof value === 'number' && isNaN(value))
        {
            throw new Error(`Cannot store NaN in datastore`);
        }
        else if (value === Infinity)
        {
            throw new Error(`Cannot store Infinity in datastore`);
        }
        else if (value === undefined)
        {
            throw new Error(`Cannot store undefined in datastore`);
        }

        return value;
    }

    protected unRegisterNode(id: string)
    {
        if (!this.nodeProxies.has(id))
        {
            throw new Error(`${logId}:Cannot remove Node "${id}" as RealTimeObject is not registered.`);
        }

        this.nodeProxies.delete(id);

        console.log(`%c${logId}:%cUnregistered RealTimeObject "${id}"`, userColor, logStyle);
    }

    protected hydrateElement(nodeElement: RealTimeObject)
    {
        const id = nodeElement.get('id').value() as string;

        // ensure local ids don't clash with hydrating ids
        consolidateId(id);

        // create the graph node
        Events.datastore.node.local.hydrated.emit({ nodeId: id });

        // recursively create children
        (nodeElement.get('children').value() as RealTimeArray).forEach((id) =>
        {
            const childId = String(id);
            const childNodeElement = this.nodes.get(childId) as RealTimeObject;

            if (childNodeElement)
            {
                this.hydrateElement(childNodeElement);
            }
            else
            {
                throw new Error(`${logId}:Could not find childElement "${childId}"`);
            }
        });
    }

    protected registerExistingNode(nodeId: string, nodeElement: RealTimeObject)
    {
        if (this.nodeProxies.has(nodeId))
        {
            throw new Error(`${logId}:Node "${nodeId}" RealTimeObject already registered.`);
        }

        // store element
        this.nodeProxies.set(nodeId, nodeElement);

        console.log(`%c${logId}:%cRegistered New RealTimeObject "${nodeId}"`, userColor, logStyle);

        // track remote events
        this.initNodeRemoteEvents(nodeId);
    }

    protected initNodeRemoteEvents(nodeId: string)
    {
        console.log(`%c${logId}:%ctrack nodeElement: "${nodeId}"`, userColor, logStyle);

        const nodeElement = this.getNodeElement(nodeId);

        // track remote events on node property changes
        nodeElement.on(RealTimeObject.Events.SET, this.onRemoteNodeRootPropertySet);

        // catch events on nodeElement custom prop defined changes (as a remote user)
        nodeElement.elementAt('customProperties', 'defined')
            .on(RealTimeObject.Events.SET, this.onRemoteNodeDefinedCustomPropSet)
            .on(RealTimeObject.Events.REMOVE, this.onRemoteNodeDefinedCustomPropRemoved);

        // catch events on nodeElement custom prop assigned changes (as a remote user)
        nodeElement.elementAt('customProperties', 'assigned')
            .on(RealTimeObject.Events.SET, this.onRemoteNodeAssignedCustomPropSet)
            .on(RealTimeObject.Events.REMOVE, this.onRemoteNodeAssignedCustomPropRemoved);

        // catch events from model
        nodeElement.get('model')
            .on(RealTimeObject.Events.SET, this.onRemoteNodeModelPropertySet)
            .on(RealTimeObject.Events.VALUE, this.onRemoteNodeModelValueSet)
            .on(RealTimeObject.Events.REMOVE, this.onRemoteNodeModelPropertyRemove);

        // catch events from cloneInfo
        nodeElement.get('cloneInfo')
            .on(RealTimeObject.Events.VALUE, this.onRemoteNodeCloneInfoValueSet);

        nodeElement.get('children')
            .on(RealTimeArray.Events.VALUE, this.onRemoteChildrenSet);
    }

    protected async joinActivity(type: string, id: string)
    {
        await this.domain.activities().join(type, id, {
            autoCreate: {
                ephemeral: true,
                worldPermissions: ['join', 'view_state', 'set_state'],
            },
        });

        console.log(`%c${logId}:%cJoined activity "${type}:${id}"`, userColor, logStyle);
    }

    public async createTexture(asset: TextureAsset)
    {
        const { id, storageKey, name, mimeType: type, size, properties } = asset;

        this.textures.set(id, {
            storageKey,
            name,
            mimeType: type,
            size,
            properties,
        } as TextureAssetSchema);

        console.log(`%c${logId}:%cCreate Asset "${id}"`, userColor, logStyle);
    }
}
