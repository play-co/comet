import { type Model, type ModelBase, createModel } from '../../model/model';
import type { ModelSchema } from '../../model/schema';
import { type Clonable, CloneInfo, CloneMode } from '../cloneInfo';
import { type CustomProperty, type CustomPropertyType, CustomProperties } from '../customProperties';
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
    public customProperties: CustomProperties<ClonableNode>;

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

        this.customProperties = new CustomProperties();

        this.view = this.createView();

        this.initModel();
        this.initCloning();
        this.init();
        this.update();
    }

    protected initModel()
    {
        this.model.on('modified', this.onModelModified);
    }

    protected initCloning()
    {
        const { cloneInfo, cloneInfo: { isVariant, isReferenceRoot } } = this;

        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            cloner.cloneInfo.cloned.push(this);

            const sourceModel = cloner.model as unknown as Model<M>;

            // note: Reference case is handled immediately in Node constructor as model is shared

            if (isVariant || isReferenceRoot)
            {
                this.model.link(sourceModel);

                if (isReferenceRoot)
                {
                    cloner.model.isReference = true;
                    this.model.isReference = true;
                }
            }
        }
    }

    protected init()
    {
        // for subclasses...
    }

    public clone<T extends ClonableNode>(cloneMode: CloneMode = CloneMode.Variant, depth = 0): T
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
            this.customProperties = cloner.customProperties.clone();

            if (isDuplicate)
            {
                const sourceModel = cloner.model;

                this.model.setValues(sourceModel.values as M);
                this.unlinkCustomProperties();

                this.cloneInfo.unlink(this);
            }

            this.updateRecursive();
        }
    }

    public unlinkCustomProperties()
    {
        // this.walk<ClonableNode>((node) =>
        // {
        //     const componentCloner = node.cloneInfo.getCloner<ClonableNode>();

        //     if (componentCloner)
        //     {
        //         const props = componentCloner.customProperties;

        //         node.customProperties = props.clone().unlink(node);

        //         componentCloner.customProperties.cloneInfo.removeCloned(node.customProperties);
        //     }
        // });
    }

    public unlink(unlinkChildren = true)
    {
        const { model, cloneInfo, cloneInfo: { isVariant, isReference, isReferenceRoot } } = this;
        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            if ((model.parent && isVariant) || isReferenceRoot)
            {
                model.flatten();
            }
            else if (isReference)
            {
                this.model = cloner.model.clone() as unknown as Model<M> & M;

                this.initModel();
            }

            this.unlinkCustomProperties();

            cloner.cloneInfo.removeCloned(this);
            this.cloneInfo.unlink(this);

            this.emit('unlinked');

            this.update();
        }

        if (unlinkChildren)
        {
            this.forEach<ClonableNode>((child) => child.unlink());
        }
    }

    public dispose()
    {
        super.dispose();

        this.model.off('modified', this.onModelModified);

        if (this.cloneInfo.isClone)
        {
            // todo: check this
            this.unlink();
        }

        this.emit('disposed');

        // todo: and this, might need a rework
        this.cloneInfo.forEachCloned<ClonableNode>((node) => node.unlink());

        this.children.forEach((child) =>
        {
            child.dispose();
        });

        this.removeAllListeners();
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
        this.getAllCloned().forEach((node) => node.update());
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

        const customProps = this.getCustomProps();

        for (const [key] of Object.entries(values))
        {
            const assignedProperty = customProps.getAssignedPropertyForModelKey(String(key));

            if (assignedProperty)
            {
                const assignedValue = assignedProperty.value;

                if (assignedValue !== undefined)
                {
                    values[key as keyof M] = assignedValue as M[keyof M];
                }
            }
        }

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

    public setCustomProperty(customKey: string, type: CustomPropertyType, value: any): CustomProperty
    {
        const property = this.customProperties.set(this as unknown as ClonableNode, customKey, type, value);

        this.updateRecursiveWithClones();

        return property;
    }

    public removeCustomProperty(customKey: string)
    {
        this.customProperties.remove(this as unknown as ClonableNode, customKey);

        const modelKey = this.customProperties.getAssignedModelKeyForCustomKey(customKey);

        if (modelKey)
        {
            this.unAssignCustomProperty(modelKey as keyof M);
        }

        this.updateRecursiveWithClones();
    }

    public assignCustomProperty(modelKey: keyof M, customPropertyKey: string)
    {
        this.customProperties.assign(String(modelKey), customPropertyKey);

        const customProps = this.getCustomProps();

        this.customProperties.assignments.forEach((assignedCustomKey: string, assignedModelKey: string) =>
        {
            const array = customProps.properties.get(assignedCustomKey);

            if (assignedCustomKey === customPropertyKey && array && array.length === 0)
            {
                this.customProperties.assignments.delete(assignedModelKey);
            }
        });

        this.update();

        this.getAllCloned().forEach((node) =>
        {
            if (!node.customProperties.hasAssignedToModelKey(String(modelKey)))
            {
                node.assignCustomProperty(String(modelKey), customPropertyKey);
            }

            node.update();
        });
    }

    public unAssignCustomProperty(modelKey: keyof M)
    {
        this.customProperties.unAssign(String(modelKey));

        this.update();

        this.getAllCloned().forEach((node) =>
        {
            if (node.customProperties.hasAssignedToModelKey(String(modelKey)))
            {
                node.unAssignCustomProperty(String(modelKey));
            }

            node.update();
        });
    }

    public getAvailableCustomPropsAsArray(props: CustomProperty[] = [])
    {
        // todo: walk up this clone tree, then traverse up through clone ancestry
        this.getCloneAncestors().forEach((node) => node.customProperties.values().forEach((array) => props.push(...array)));

        return props;
    }

    public getCustomProps()
    {
        const array = this.getAvailableCustomPropsAsArray();
        const customProps = new CustomProperties();

        array.forEach((property) =>
        {
            customProps.addProperty(property);
        });

        customProps.assignments = this.customProperties.assignments;

        return customProps;
    }

    public getAllCloned()
    {
        const { isVariant } = this.cloneInfo;

        const nodes: ClonableNode[] = [];

        if (isVariant)
        {
            const original = this.getOriginal();
            const originalCloned = original.getAllCloned();
            const cloneRoot = this.getCloneRoot();

            if (cloneRoot)
            {
                const cloneRootCloned = cloneRoot.getAllCloned();

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

    public getRemoveChildCloneTarget(): ClonableNode
    {
        const { isVariant, isRoot } = this.cloneInfo;

        return (isVariant || isRoot) ? this as unknown as ClonableNode : this.getOriginal();
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
        const { isVariant, isVariantRoot, isReferenceRoot, cloner } = this.cloneInfo;

        if (cloner)
        {
            if (isReferenceRoot)
            {
                return cloner as ClonableNode;
            }
            else if (isVariant || isVariantRoot)
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
