import { type Model, type ModelBase, createModel } from '../../model/model';
import type { ModelSchema } from '../../model/schema';
import { type Clonable, CloneInfo, CloneMode } from '../cloneInfo';
import type {
    CustomProperty,
    CustomPropertyType,
    CustomPropertyValueType,
} from '../customProperties';
import { registerNewNode } from '../nodeFactory';
import { type GraphNodeEvents, GraphNode, sortNodesByCreation } from './graphNode';

export type ClonableNodeEvents = GraphNodeEvents | 'modelChanged' | 'unlinked';

export type AnyNode = ClonableNode<any, any, any>;

export type ClonableNodeConstructor = {
    new (options: NodeOptions<any>): AnyNode;
};

export interface NodeOptions<M>
{
    id?: string;
    model?: Partial<M>;
    cloneInfo?: CloneInfo;
}

const modelBase = {} as ModelBase;

export abstract class ClonableNode<
    M extends ModelBase = typeof modelBase,
    V extends object = object,
    E extends string = string,
> extends GraphNode<ClonableNodeEvents | E> implements Clonable
{
    public model: Model<M> & M;
    public view: V;

    public cloneInfo: CloneInfo;
    public defineCustomProperties: Map<string, CustomProperty>;
    public assignedCustomProperties: Map<keyof M, string>;

    // public static emitter: EventEmitter<ClonableNodeEvent> = new EventEmitter<ClonableNodeEvent>();

    constructor(
        options: NodeOptions<M> = {},
    )
    {
        super(options.id);

        const { model = {}, cloneInfo = new CloneInfo() } = options;

        this.cloneInfo = cloneInfo;

        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner && cloneInfo.isReference)
        {
            this.model = cloner.model as unknown as Model<M> & M;
        }
        else
        {
            const schema = this.modelSchema();

            this.model = createModel(schema, {
                ...model,
            });
        }

        this.defineCustomProperties = new Map();
        this.assignedCustomProperties = new Map();

        this.view = this.createView();

        this.initModel();
        this.initCloning();
        this.init();
        this.update();

        this.emit('created', this);
    }

    protected initModel()
    {
        this.model.on('modified', this.onModelModified);
    }

    protected initCloning()
    {
        const { cloneInfo, cloneInfo: { isVariantLike, isReferenceRoot } } = this;

        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            cloner.cloneInfo.cloned.push(this);

            const sourceModel = cloner.model as unknown as Model<M>;

            // note: Reference case is handled immediately in Node constructor as model is shared

            if (isVariantLike)
            {
                this.model.link(sourceModel);

                if (isReferenceRoot)
                {
                    cloner.model.isReference = true;
                    this.model.isReference = true;
                }
            }

            registerNewNode(this.cast<ClonableNode>());
        }
    }

    protected init()
    {
        // for subclasses...
    }

    public clone<T extends ClonableNode>(cloneMode: CloneMode = CloneMode.ReferenceRoot, depth = 0): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as ClonableNodeConstructor;

        const cloneInfo = new CloneInfo(cloneMode, this);

        if (depth === 0)
        {
            // change to root type for top level clone node
            if (cloneInfo.isReference)
            {
                cloneInfo.cloneMode = CloneMode.ReferenceRoot;
            }
            else if (cloneInfo.isVariant)
            {
                cloneInfo.cloneMode = CloneMode.VariantRoot;
            }
        }

        const node = new Ctor(
            {
                cloneInfo,
            },
        );

        this.forEach<ClonableNode>((child) =>
        {
            const childNode = child.clone(cloneMode, depth + 1);

            childNode.setParent(node);
        });

        node.onCloned();

        return node as T;
    }

    public onCloned()
    {
        const { cloneInfo, cloneInfo: { isDuplicate } } = this;
        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            if (isDuplicate)
            {
                const sourceModel = cloner.model;

                this.model.setValues(sourceModel.values as M);

                this.cloneInfo.unlink(this);
            }

            this.updateRecursive();
        }
    }

    public unlink()
    {
        const { model, cloneInfo } = this;
        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            if (cloneInfo.isReference)
            {
                const values = this.model.values;

                this.model = cloner.model.clone() as unknown as Model<M> & M;
                this.model.setValues(values);
                this.initModel();
            }
            else
            {
                model.flatten();
            }

            cloner.cloneInfo.removeCloned(this);
            this.cloneInfo.unlink(this);

            this.emit('unlinked');

            this.update();
        }
    }

    public dispose()
    {
        super.dispose();

        this.model.off('modified', this.onModelModified);

        if (this.cloneInfo.isClone)
        {
            this.unlink();
        }

        this.emit('disposed');
    }

    public isReferencingNode<T extends GraphNode<string>>(refNode: T): boolean
    {
        if (super.isReferencingNode(refNode))
        {
            return true;
        }

        const node = refNode.cast<ClonableNode>();

        // check original
        if (this.getOriginal() === node)
        {
            return true;
        }

        // check clone ancestors
        for (const ancestor of node.getCloneAncestors())
        {
            if (ancestor === node)
            {
                return true;
            }
        }

        // check cloned descendants
        for (const descendant of node.getClonedDescendants())
        {
            if (descendant === node)
            {
                return true;
            }
        }

        return false;
    }

    public update(recursive = false)
    {
        if (this.view)
        {
            this.updateView();
        }

        if (recursive)
        {
            this.forEach<ClonableNode>((child) => child.update(true));
        }
    }

    public updateRecursive()
    {
        return this.update(true);
    }

    public updateRecursiveWithClones()
    {
        this.update(true);
        this.getClonedDescendants().forEach((node) => node.update());
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.update();

        this.emit('modelChanged', key, value, oldValue);
    };

    public getView<T = V>(): T
    {
        return this.view as unknown as T;
    }

    public get values()
    {
        const values = this.model.values;

        return values;
    }

    public get(modelKey: keyof M): M[keyof M]
    {
        return this.model.getValue(modelKey);
    }

    public set<K extends keyof M>(modelKey: K, value: M[K])
    {
        this.model.setValue(modelKey, value);
    }

    public getClonedDescendants()
    {
        const { isVariant } = this.cloneInfo;

        const nodes: ClonableNode[] = [];

        if (isVariant)
        {
            const original = this.getOriginal();
            const originalCloned = original.getClonedDescendants();
            const cloneRoot = this.getCloneRoot();

            if (cloneRoot)
            {
                const cloneRootCloned = cloneRoot.getClonedDescendants();

                originalCloned.forEach((originalClone) =>
                {
                    cloneRootCloned.forEach((clone) =>
                    {
                        if (clone.contains(originalClone))
                        {
                            nodes.push(originalClone);
                        }
                    });
                });
            }
        }
        else
        {
            nodes.push(...getAllCloned(this as unknown as ClonableNode));
        }

        nodes.sort(sortNodesByCreation);

        return nodes;
    }

    public getCloneRoot()
    {
        return this.walk<ClonableNode, { node?: ClonableNode }>((node, options) =>
        {
            if (node.cloneInfo.isRoot)
            {
                options.data.node = node;
                options.cancel = true;
            }
        }, {
            direction: 'up',
        }).node;
    }

    public getOriginal(): ClonableNode
    {
        const { cloneInfo: { isOriginal } } = this;

        if (isOriginal)
        {
            return this as unknown as ClonableNode;
        }

        let node: ClonableNode = this as unknown as ClonableNode;

        while (!node.cloneInfo.isOriginal)
        {
            if (node.cloneInfo.cloner)
            {
                node = node.cloneInfo.cloner as ClonableNode;
            }
            else
            {
                throw new Error('Could find original cloned node as parent undefined');
            }
        }

        return node;
    }

    public getModificationCloneTarget(): ClonableNode
    {
        const { isVariantLike, isOriginal } = this.cloneInfo;

        return (isVariantLike || isOriginal) ? this as unknown as ClonableNode : this.cloneInfo.getCloner();
    }

    public getAddChildCloneTarget(): ClonableNode
    {
        const { cloner, isReferenceOrRoot } = this.cloneInfo;

        if (cloner && isReferenceOrRoot)
        {
            return cloner as unknown as ClonableNode;
        }

        return this as unknown as ClonableNode;
    }

    public getCloneTarget(): ClonableNode
    {
        const { isVariantOrRoot, isReferenceRoot, cloner } = this.cloneInfo;

        if (cloner)
        {
            if (isReferenceRoot)
            {
                return cloner as ClonableNode;
            }
            else if (isVariantOrRoot)
            {
                return this as unknown as ClonableNode;
            }
        }

        return this.getOriginal();
    }

    public getNewChildCloneMode()
    {
        const { isReferenceOrRoot, isVariantOrRoot, cloneMode } = this.cloneInfo;

        if (isReferenceOrRoot)
        {
            return CloneMode.Reference;
        }
        else if (isVariantOrRoot)
        {
            return CloneMode.Variant;
        }

        return cloneMode;
    }

    public getCloneAncestors(): ClonableNode[]
    {
        const array: ClonableNode[] = [];

        let node: ClonableNode = this.cloneInfo.getCloner<ClonableNode>();

        while (node !== undefined)
        {
            array.push(node);
            node = node.cloneInfo.getCloner<ClonableNode>();
        }

        return array;
    }

    public getCustomProperty(customKey: string)
    {
        return this.defineCustomProperties.get(customKey);
    }

    public setCustomProperty(customKey: string, type: CustomPropertyType, value?: CustomPropertyValueType)
    {
        const { defineCustomProperties } = this;

        let prop = defineCustomProperties.get(customKey);

        if (prop)
        {
            prop.type = type;
            prop.value = value;
        }
        else
        {
            prop = {
                type,
                value,
            };

            defineCustomProperties.set(customKey, prop);
        }

        // note: updating all nodes is done by action
    }

    public removeCustomProperty(customKey: string)
    {
        const { defineCustomProperties } = this;

        const prop = defineCustomProperties.get(customKey);

        if (prop)
        {
            defineCustomProperties.delete(customKey);
        }

        // note: updating all nodes is done by action
    }

    public assignCustomProperty(modelKey: keyof M, customKey: string): {
        prop?: CustomProperty;
        oldCustomKey?: string;
    }
    {
        const definedProps = this.getDefinedCustomProps();
        const propArray = definedProps.get(customKey);

        if (propArray?.length)
        {
            const prop = propArray[0];

            const oldCustomKey = this.assignedCustomProperties.get(modelKey);

            this.assignedCustomProperties.set(modelKey, customKey);

            // note: we don't change the model value, that is done by the calling AssignCustomProp command
            return { prop, oldCustomKey };
        }

        return {};
    }

    public unAssignCustomProperty(modelKey: keyof M): string | undefined
    {
        const { assignedCustomProperties } = this;
        const customKey = assignedCustomProperties.get(modelKey);

        if (customKey)
        {
            assignedCustomProperties.delete(modelKey);

            // note: we don't change the model value, that is done by the calling UnAssignCustomProp command
            return customKey;
        }

        return undefined;
    }

    public getDefinedCustomProps()
    {
        const definedProps: Map<string, CustomProperty[]> = new Map();

        this.walk<ClonableNode>((node) =>
        {
            node.defineCustomProperties.forEach((prop, key) =>
            {
                let array = definedProps.get(key);

                if (!array)
                {
                    array = [];
                    definedProps.set(key, array);
                }

                array.push(prop);
            });
        }, { direction: 'up' });

        return definedProps;
    }

    public getAssignedModelKeys(assignedCustomKey: string)
    {
        const modelKeys: (keyof M)[] = [];

        this.assignedCustomProperties.forEach((customKey, modelKey) =>
        {
            if (customKey === assignedCustomKey)
            {
                modelKeys.push(modelKey);
            }
        });

        return modelKeys;
    }

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}

function getAllCloned(node: ClonableNode, array: ClonableNode[] = []): ClonableNode[]
{
    node.cloneInfo.forEachCloned<ClonableNode>((cloned) =>
    {
        array.push(cloned);
        getAllCloned(cloned, array);
    });

    return array;
}
