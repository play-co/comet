import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { CloneInfoSchema, NodeSchema, ProjectSchema } from '../../core/nodes/schema';

export interface Datastore
{
    isConnected: () => boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    batch: (fn: () => void) => Promise<void>;
    registerNode: (nodeId: string) => void;
    hasNode: (nodeId: string) => boolean;
    hasNodeProxy: (nodeId: string) => boolean;
    getNodeSchema: (nodeId: string) => NodeSchema;
    createProject: (name: string, id?: string) => Promise<ClonableNode>;
    openProject: (id: string) => Promise<ClonableNode>;
    hasProject: (name: string) => Promise<boolean>;
    closeProject: (name: string) => Promise<void>;
    deleteProject: (name: string) => Promise<void>;
    hydrate: () => ClonableNode;
    reset: () => void;
    toProjectSchema: () => ProjectSchema;
    fromProjectSchema: (schema: ProjectSchema) => void;
    getProjectId: () => string;
}

export interface DatastoreCommandProvider
{
    createNode: (nodeSchema: NodeSchema) => void;
    removeNode: (nodeId: string) => void;
    setParent: (childId: string, parentId: string) => void;
    modifyModel: (nodeId: string, values: object) => void;
    updateCloneInfo: (nodeId: string, cloneInfoSchema: CloneInfoSchema) => void;
    setCustomProperty: (nodeId: string, customKey: string, type: CustomPropertyType, value: CustomPropertyValueType | undefined) => void;
    removeCustomProperty: (nodeId: string, customKey: string) => void;
    assignCustomProperty: (nodeId: string, modelKey: string, customKey: string) => void;
    unassignCustomProperty: (nodeId: string, modelKey: string) => void;
    setChildren: (nodeId: string, childIds: string[]) => void;
    resetModel: (nodeId: string, initValues: {}) => void;
}

export interface DatastoreChangeEventHandler<RemoteChangeEvent>
{
    onRemoteNodeCreated: (event: RemoteChangeEvent) => void;
    onRemoteNodeRemoved: (event: RemoteChangeEvent) => void;
    onRemoteNodeRootPropertySet: (event: RemoteChangeEvent) => void;
    onRemoteNodeDefinedCustomPropSet: (event: RemoteChangeEvent) => void;
    onRemoteNodeDefinedCustomPropRemoved: (event: RemoteChangeEvent) => void;
    onRemoteNodeAssignedCustomPropSet: (event: RemoteChangeEvent) => void;
    onRemoteNodeAssignedCustomPropRemoved: (event: RemoteChangeEvent) => void;
    onRemoteNodeModelPropertySet: (event: RemoteChangeEvent) => void;
    onRemoteNodeModelValueSet: (event: RemoteChangeEvent) => void;
    onRemoteNodeModelPropertyRemove: (event: RemoteChangeEvent) => void;
    onRemoteNodeCloneInfoValueSet: (event: RemoteChangeEvent) => void;
    onRemoteChildrenSet: (event: RemoteChangeEvent) => void;
}

export abstract class DatastoreBase<
    NodeProxyObject,
    RemoteChangeEvent,
>
implements Datastore, DatastoreCommandProvider, DatastoreChangeEventHandler<RemoteChangeEvent>
{
    protected nodeProxies: Map<string, NodeProxyObject>;

    constructor()
    {
        this.nodeProxies = new Map();
    }

    // general public API
    public abstract isConnected(): boolean;
    public abstract connect(): Promise<void>;
    public abstract disconnect(): Promise<void>;
    public abstract batch(fn: () => void): Promise<void>;
    public abstract registerNode(nodeId: string): void;
    public abstract hasNode(nodeId: string): boolean;
    public abstract hasNodeProxy(nodeId: string): boolean;
    public abstract getNodeSchema(nodeId: string): NodeSchema;
    public abstract createProject(name: string, id?: string): Promise<ClonableNode>;
    public abstract openProject(id: string): Promise<ClonableNode>;
    public abstract hasProject(name: string): Promise<boolean>;
    public abstract closeProject(name: string): Promise<void>;
    public abstract deleteProject(name: string): Promise<void>;
    public abstract hydrate(): ClonableNode;
    public abstract reset(): void;
    public abstract toProjectSchema(): ProjectSchema;
    public abstract fromProjectSchema(schema: ProjectSchema): void;
    public abstract getProjectId(): string;

    // command API
    public abstract createNode(nodeSchema: NodeSchema): void;
    public abstract removeNode(nodeId: string): void;
    public abstract setParent(childId: string, parentId: string): void;
    public abstract modifyModel(nodeId: string, values: object): void;
    public abstract updateCloneInfo(nodeId: string, cloneInfoSchema: CloneInfoSchema): void;
    public abstract setCustomProperty(nodeId: string, customKey: string, type: CustomPropertyType, value: CustomPropertyValueType | undefined): void;
    public abstract removeCustomProperty(nodeId: string, customKey: string): void;
    public abstract assignCustomProperty(nodeId: string, modelKey: string, customKey: string): void;
    public abstract unassignCustomProperty(nodeId: string, modelKey: string): void;
    public abstract setChildren(nodeId: string, childIds: string[]): void;
    public abstract resetModel(nodeId: string, initValues: {}): void;

    // remote change event handles
    public abstract onRemoteNodeCreated(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeRemoved(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeRootPropertySet(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeDefinedCustomPropSet(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeDefinedCustomPropRemoved(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeAssignedCustomPropSet(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeAssignedCustomPropRemoved(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeModelPropertySet(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeModelValueSet(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeModelPropertyRemove(event: RemoteChangeEvent): void;
    public abstract onRemoteNodeCloneInfoValueSet(event: RemoteChangeEvent): void;
    public abstract onRemoteChildrenSet(event: RemoteChangeEvent): void;
}
