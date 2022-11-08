import type { TextureAsset } from '../../core/assets/textureAsset';
import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import type { CustomPropertyType, CustomPropertyValueType } from '../../core/nodes/customProperties';
import type { CloneInfoSchema, NodeSchema } from '../../core/nodes/schema';

export interface Datastore
{
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    batch: (fn: () => void) => Promise<void>;
    registerNode: (nodeId: string) => void;
    hasNode: (nodeId: string) => boolean;
    hasRegisteredNode: (nodeId: string) => boolean;
    getNodeAsJSON: (nodeId: string) => NodeSchema;
    createProject: (name: string, id?: string) => Promise<ClonableNode>;
    openProject: (id: string) => Promise<ClonableNode>;
    hasProject: (name: string) => Promise<boolean>;
    closeProject: (name: string) => Promise<void>;
    deleteProject: (name: string) => Promise<void>;
    hydrate: () => ClonableNode;
    reset: () => void;
}

export interface DatastoreCommandProvider
{
    createNode: (nodeSchema: NodeSchema) => void;
    removeNode: (nodeId: string) => void;
    setNodeParent: (childId: string, parentId: string) => void;
    modifyNodeModel: (nodeId: string, values: object) => void;
    updateNodeCloneInfo: (nodeId: string, cloneInfoSchema: CloneInfoSchema) => void;
    setCustomProperty: (nodeId: string, customKey: string, type: CustomPropertyType, value: CustomPropertyValueType | undefined) => void;
    removeCustomProperty: (nodeId: string, customKey: string) => void;
    assignCustomProperty: (nodeId: string, modelKey: string, customKey: string) => void;
    unassignCustomProperty: (nodeId: string, modelKey: string) => void;
    createTexture: (asset: TextureAsset) => Promise<void>;
}

export interface DatastoreChangeEventHandler<ChangeEventType>
{
    onRemoteNodeCreated: (event: ChangeEventType) => void;
    onRemoteNodeRemoved: (event: ChangeEventType) => void;
    onRemoteNodeRootPropertySet: (event: ChangeEventType) => void;
    onRemoteNodeDefinedCustomPropSet: (event: ChangeEventType) => void;
    onRemoteNodeDefinedCustomPropRemoved: (event: ChangeEventType) => void;
    onRemoteNodeAssignedCustomPropSet: (event: ChangeEventType) => void;
    onRemoteNodeAssignedCustomPropRemoved: (event: ChangeEventType) => void;
    onRemoteNodeModelPropertySet: (event: ChangeEventType) => void;
    onRemoteNodeModelValueSet: (event: ChangeEventType) => void;
    onRemoteNodeModelPropertyRemove: (event: ChangeEventType) => void;
    onRemoteNodeCloneInfoValueSet: (event: ChangeEventType) => void;
}

export abstract class DatastoreBase<NodeProxyObject, ChangeEventType>
implements Datastore, DatastoreCommandProvider, DatastoreChangeEventHandler<ChangeEventType>
{
    protected nodeProxies: Map<string, NodeProxyObject>;

    constructor()
    {
        this.nodeProxies = new Map();
    }

    // general public API
    public abstract connect(): Promise<void>;
    public abstract disconnect(): Promise<void>;
    public abstract batch(fn: () => void): Promise<void>;
    public abstract registerNode(nodeId: string): void;
    public abstract hasNode(nodeId: string): boolean;
    public abstract hasRegisteredNode(nodeId: string): boolean;
    public abstract getNodeAsJSON(nodeId: string): NodeSchema;
    public abstract createProject(name: string, id?: string): Promise<ClonableNode>;
    public abstract openProject(id: string): Promise<ClonableNode>;
    public abstract hasProject(name: string): Promise<boolean>;
    public abstract closeProject(name: string): Promise<void>;
    public abstract deleteProject(name: string): Promise<void>;
    public abstract hydrate(): ClonableNode;
    public abstract reset(): void;

    // command API
    public abstract createNode(nodeSchema: NodeSchema): void;
    public abstract removeNode(nodeId: string): void;
    public abstract setNodeParent(childId: string, parentId: string): void;
    public abstract modifyNodeModel(nodeId: string, values: object): void;
    public abstract updateNodeCloneInfo(nodeId: string, cloneInfoSchema: CloneInfoSchema): void;
    public abstract setCustomProperty(nodeId: string, customKey: string, type: CustomPropertyType, value: CustomPropertyValueType | undefined): void;
    public abstract removeCustomProperty(nodeId: string, customKey: string): void;
    public abstract assignCustomProperty(nodeId: string, modelKey: string, customKey: string): void;
    public abstract unassignCustomProperty(nodeId: string, modelKey: string): void;
    public abstract createTexture(asset: TextureAsset): Promise<void>;

    // change event handles
    public abstract onRemoteNodeCreated(event: ChangeEventType): void;
    public abstract onRemoteNodeRemoved(event: ChangeEventType): void;
    public abstract onRemoteNodeRootPropertySet(event: ChangeEventType): void;
    public abstract onRemoteNodeDefinedCustomPropSet(event: ChangeEventType): void;
    public abstract onRemoteNodeDefinedCustomPropRemoved(event: ChangeEventType): void;
    public abstract onRemoteNodeAssignedCustomPropSet(event: ChangeEventType): void;
    public abstract onRemoteNodeAssignedCustomPropRemoved(event: ChangeEventType): void;
    public abstract onRemoteNodeModelPropertySet(event: ChangeEventType): void;
    public abstract onRemoteNodeModelValueSet(event: ChangeEventType): void;
    public abstract onRemoteNodeModelPropertyRemove(event: ChangeEventType): void;
    public abstract onRemoteNodeCloneInfoValueSet(event: ChangeEventType): void;
    public abstract onTextureCreated(event: ChangeEventType): void;
    public abstract onTextureRemoved(event: ChangeEventType): void;
}
