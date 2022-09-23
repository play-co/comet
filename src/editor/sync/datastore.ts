import type {
    ConvergenceDomain,
    IConvergenceEvent,
    ObjectSetEvent,
    RealTimeArray,
    RealTimeModel,
} from '@convergence/convergence';
import Convergence, { RealTimeObject } from '@convergence/convergence';
import { EventEmitter } from 'eventemitter3';

import type { ModelBase, ModelValue } from '../../core/model/model';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { GraphNode } from '../../core/nodes/abstract/graphNode';
import { consolidateNodeId, getGraphNode } from '../../core/nodes/factory';
import { type NodeOptionsSchema, type NodeSchema, createProjectSchema, getCloneInfoSchema } from '../../core/nodes/schema';
import type { ObjectGraph } from './objectGraph';
import { getUserName } from './user';

const userName = getUserName();

export const defaultProjectSettings = {
    collection: 'projects',
    overrideCollectionWorldPermissions: false,
    ephemeral: false,
    worldPermissions: { read: true, write: true, remove: true, manage: true },
};

export const connectionTimeout = 2500;

export type DatastoreEvents =
| 'datastoreHydrated'
| 'datastoreNodeCreated'
| 'datastoreNodeSetParent'
| 'datastoreNodeRemoved'
| 'datastoreCustomPropDefined'
| 'datastoreCustomPropUndefined'
| 'datastoreCustomPropAssigned'
| 'datastoreCustomPropUnAssigned'
| 'datastoreNodeCloned'
| 'datastoreModelModified'
| 'datastoreCloneInfoModified'
| 'datastoreNodeUnlinked';

const logStyle = 'color:cyan';

export class Datastore extends EventEmitter<DatastoreEvents>
{
    protected _domain?: ConvergenceDomain;
    protected _model?: RealTimeModel;
    public nodeRealtimeObjects: Map<string, RealTimeObject>;

    public static instance: Datastore;

    constructor()
    {
        super();

        Datastore.instance = this;
        this.nodeRealtimeObjects = new Map();
    }

    public get domain()
    {
        if (!this._domain)
        {
            throw new Error('Domain not found');
        }

        return this._domain;
    }

    get model()
    {
        if (!this._model)
        {
            throw new Error('Datastore model not initialised');
        }

        return this._model;
    }

    get nodes()
    {
        return this.model.elementAt('nodes') as RealTimeObject;
    }

    protected async initProjectModel(projectModel: RealTimeModel)
    {
        this._model = projectModel;

        await this.joinActivity('editProject', projectModel.modelId());

        // catch events when a remote user...
        this.nodes.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const nodeElement = (event as ObjectSetEvent).value as RealTimeObject;
            const nodeId = nodeElement.get('id').value() as string;
            const parentId = nodeElement.get('parent').value() as string | undefined;

            consolidateNodeId(nodeId);

            console.log(`%c${userName}:nodes.set: ${JSON.stringify(nodeElement.toJSON())}`, logStyle);

            this.registerNode(nodeId, nodeElement);

            this.emit('datastoreNodeCreated', nodeElement);

            if (parentId)
            {
                const childId = nodeElement.get('id').value() as string;

                this.emit('datastoreNodeSetParent', parentId, childId);
            }
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const nodeId = (event as ObjectSetEvent).key;

            const nodeElement = (event as ObjectSetEvent).oldValue as RealTimeObject;
            const parentId = nodeElement.get('parent').value() as string | undefined;

            console.log(`%c${userName}:nodes.remove: ${nodeId}`, logStyle);

            if (parentId)
            {
                this.emit('datastoreNodeRemoved', nodeId, parentId);
            }
        });
    }

    public hydrate(objectGraph: ObjectGraph)
    {
        const { nodes } = this;

        const nodeElements: Map<string, RealTimeObject> = new Map();

        // prepare all nodeElements

        nodes.keys().forEach((id) =>
        {
            const nodeElement = nodes.get(id) as RealTimeObject;

            nodeElements.set(id, nodeElement);
        });

        // get the root
        const rootId = this.model.root().get('root').value() as string;
        const projectNode = nodeElements.get(rootId);

        const hydrate = (nodeElement: RealTimeObject, parentNode?: ClonableNode) =>
        {
            const id = nodeElement.get('id').value() as string;

            // ensure local ids don't clash with hydrating ids
            consolidateNodeId(id);

            // register the RealTimeObject for this node

            this.registerNode(id, nodeElement);

            // create the graph node

            const nodeSchema = nodeElement.toJSON() as NodeSchema<{}>;

            const node = objectGraph.createGraphNode(nodeSchema);

            // add to parent if provided

            if (parentNode)
            {
                parentNode.addChild(node as GraphNode);
            }

            // recursively create children

            (nodeElement.get('children').value() as RealTimeArray).forEach((id) =>
            {
                const childId = String(id);
                const childNodeElement = nodeElements.get(childId);

                if (childNodeElement)
                {
                    hydrate(childNodeElement, node);
                }
                else
                {
                    throw new Error(`Could not find childElement "${childId}"`);
                }
            });
        };

        if (projectNode)
        {
            // start from the root node (Project)

            hydrate(projectNode);
        }
        else
        {
            throw new Error('Could not find project node');
        }

        // update the application
        this.emit('datastoreHydrated');
    }

    public registerNode(id: string, nodeElement: RealTimeObject)
    {
        if (this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`Node "${id}" RealTimeObject already registered.`);
        }

        // track element
        this.nodeRealtimeObjects.set(id, nodeElement);

        // catch events on nodeElement prop changes (as a remote user)
        nodeElement.on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const key = (event as ObjectSetEvent).key;

            if (key === 'parent')
            {
                const parentId = (event as ObjectSetEvent).value.value();
                const childId = nodeElement.get('id').value();

                console.log(`%c${userName}:${id}:parent.set: ${parentId} ${childId}`, logStyle);

                this.emit('datastoreNodeSetParent', parentId, childId);
            }
        });

        // catch events on nodeElement custom prop defined changes (as a remote user)
        nodeElement.elementAt('customProperties', 'defined').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const name = (event as ObjectSetEvent).key;
            const element = (event as ObjectSetEvent).value as RealTimeObject;

            const { type, value } = element.toJSON();
            const info = JSON.stringify(element.toJSON());

            console.log(`%c${userName}:${id}:customProperties.defined: ${info}`, logStyle);

            this.emit('datastoreCustomPropDefined', id, name, type, value);
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const propName = (event as ObjectSetEvent).key;

            console.log(`%c${userName}:${id}:customProperties.undefined: "${propName}"`, logStyle);

            this.emit('datastoreCustomPropUndefined', id, propName);
        });

        // catch events on nodeElement custom prop assigned changes (as a remote user)
        nodeElement.elementAt('customProperties', 'assigned').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const modelKey = (event as ObjectSetEvent).key;
            const customKey = (event as ObjectSetEvent).value.value() as string;

            console.log(`%c${userName}:${id}:customProperties.assign: "${modelKey}->${customKey}"`, logStyle);

            this.emit('datastoreCustomPropAssigned', id, modelKey, customKey);
        }).on(RealTimeObject.Events.REMOVE, (event: IConvergenceEvent) =>
        {
            const modelKey = (event as ObjectSetEvent).key;

            console.log(`%c${userName}:${id}:customProperties.unassigned: "${modelKey}"`, logStyle);

            this.emit('datastoreCustomPropUnAssigned', id, modelKey);
        });

        // catch events from model
        nodeElement.elementAt('model').on(RealTimeObject.Events.SET, (event: IConvergenceEvent) =>
        {
            const key = (event as ObjectSetEvent).key;
            const value = (event as ObjectSetEvent).value.value() as ModelValue;

            console.log(`%c${userName}:${id}:model.set: ${key}->${value}`, logStyle);

            this.emit('datastoreModelModified', id, key, value);
        }).on(RealTimeObject.Events.VALUE, (event: IConvergenceEvent) =>
        {
            const model = (event as ObjectSetEvent).element.value();

            console.log(`%c${userName}:${id}:model.value: ${JSON.stringify(model)}`, logStyle);

            this.emit('datastoreModelModified', id, undefined, model);
        }); // todo: REMOVE?

        // catch events from cloneInfo
        nodeElement.elementAt('cloneInfo').on(RealTimeObject.Events.VALUE, (event: IConvergenceEvent) =>
        {
            const cloneInfo = (event as ObjectSetEvent).element.value();

            console.log(`%c${userName}:${id}:cloneInfo.set: ${JSON.stringify(cloneInfo)}`, logStyle);

            this.emit('datastoreCloneInfoModified', id, cloneInfo);
        });

        console.log(`${userName}:Registered RealTimeObject "${id}"`);
    }

    public createNode<M extends ModelBase>(
        nodeSchema: NodeSchema<M>,
        nodeOptions: NodeOptionsSchema<M> = {},
        clonedNode?: ClonableNode,
    )
    {
        const parentId = nodeOptions.parent ?? nodeSchema.parent;

        const nodeElement = this.nodes.set(nodeSchema.id, {
            ...nodeSchema,
            parent: parentId,
        }) as RealTimeObject;

        this.registerNode(nodeSchema.id, nodeElement);

        this.emit('datastoreNodeCreated', nodeSchema, clonedNode);

        if (parentId)
        {
            this.setParentNode(nodeSchema.id, parentId);
        }
    }

    public removeNode(nodeId: string)
    {
        const nodeElement = this.getNodeElement(nodeId);

        const parentId = nodeElement.get('parent').value() as string;

        // cleanup cloned reference in cloner if present
        const node = getGraphNode(nodeId);

        if (node)
        {
            const cloner = node.cloneInfo.cloner as ClonableNode;

            if (cloner)
            {
                const cloneInfoSchema = getCloneInfoSchema(cloner);
                const clonerNodeElement = this.getNodeElement(cloner.id);

                cloner.cloneInfo.removeCloned(node);
                clonerNodeElement.get('cloneInfo').value(cloneInfoSchema);
            }

            // remove from nodes RealTimeObject
            this.nodes.remove(nodeId);

            // remove from parents children array
            const parentElement = this.getNodeElement(parentId);
            const childArray = parentElement.get('children') as RealTimeArray;
            const index = childArray.findIndex((id) =>
                id.value() === nodeId);

            if (index === -1)
            {
                throw new Error(`Could not remove child node "${nodeId}" from parent "${parentId}"`);
            }

            childArray.remove(index);

            // unregister RealTimeObject for node
            this.unRegisterNode(nodeId);

            this.emit('datastoreNodeRemoved', nodeId, parentId);
        }
    }

    public setParentNode(nodeId: string, parentId: string)
    {
        const parentElement = this.getNodeElement(parentId);
        const childArray = parentElement.get('children') as RealTimeArray;

        childArray.push(nodeId);
        this.emit('datastoreNodeSetParent', nodeId, parentId);
    }

    public connect(): Promise<ConvergenceDomain>
    {
        return new Promise<ConvergenceDomain>((resolve, reject) =>
        {
            const url = 'https://localhost/realtime/convergence/default';

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
                clearTimeout(timeout);
                console.log(`%cConnected as ${userName}!`, 'color:lime');

                this._domain = domain;
                resolve(domain);
            }).catch(reject);
        });
    }

    public disconnect(): void
    {
        if (!this.domain.isDisposed())
        {
            this.domain.dispose();
            console.log('%c${userName}:Domain disposed', logStyle);
        }
    }

    public batch(fn: () => void)
    {
        this.model.startBatch();
        fn();
        this.model.completeBatch();
    }

    public async createProject(name: string, id?: string)
    {
        const data = createProjectSchema(name);

        const model = await this.domain.models().openAutoCreate({
            ...defaultProjectSettings,
            id,
            data,
        });

        console.log(`%c${userName}:Created project "${model.modelId()}"`, logStyle);

        await this.openProject(model.modelId());
    }

    public async openProject(id: string)
    {
        const model = await this.domain.models().open(id);

        console.log(`%c${userName}:Opened project "${model.modelId()}"`, logStyle);

        await this.initProjectModel(model);
    }

    protected async joinActivity(type: string, id: string)
    {
        await this.domain.activities().join(type, id, {
            autoCreate: {
                ephemeral: true,
                worldPermissions: ['join', 'view_state', 'set_state'],
            },
        });

        console.log(`%c${userName}:Joined activity "${type}:${id}"`, logStyle);
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

        console.log(`%c${userName}:Delete project "${id}"`, logStyle);
    }

    public unRegisterNode(id: string)
    {
        if (!this.nodeRealtimeObjects.has(id))
        {
            throw new Error(`Cannot remove Node "${id}" as RealTimeObject is not registered.`);
        }

        this.nodeRealtimeObjects.delete(id);

        console.log(`${userName}:Unregistered RealTimeObject "${id}"`);
    }

    public getNodeElement(id: string)
    {
        const nodeElement = this.nodeRealtimeObjects.get(id);

        if (!nodeElement)
        {
            throw new Error(`Node "${id}" RealTimeObject not registered.`);
        }

        return nodeElement;
    }
}