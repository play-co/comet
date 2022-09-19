import { type Model, type ModelBase, createModel } from '../../model/model';
import type { ModelSchema } from '../../model/schema';
import { type Clonable, CloneInfo, CloneMode } from '../cloneInfo';
import { type CustomProperty, type CustomPropertyType, CustomProperties } from '../customProperties';
import { type GraphNodeEvents, GraphNode } from './graphNode';

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

            this.enableCloneEvents();
        }
    }

    protected init()
    {
        // for subclasses...
    }

    public clone<T extends ClonableNode>(cloneMode: CloneMode = CloneMode.Variant, depth = 0): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as ClonableNodeConstructor;

        const cloneInfo = new CloneInfo(
            cloneMode === CloneMode.Reference && depth === 0
                ? CloneMode.ReferenceRoot
                : cloneMode,
            this,
        );

        const component = new Ctor(
            {
                cloneInfo,
            },
        );

        this.forEach<ClonableNode>((child) =>
        {
            const childNode = (child).clone(cloneMode, depth + 1);

            childNode.setParent(component);
        });

        component.onCloned();

        return component as T;
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
                this.unlinkCustomProperties();
            }

            this.updateRecursive();
        }
    }

    public unlinkCustomProperties()
    {
        this.walk<ClonableNode>((component) =>
        {
            const componentCloner = component.cloneInfo.getCloner<ClonableNode>();

            if (componentCloner)
            {
                const props = componentCloner.customProperties;

                component.customProperties = props.clone().unlink(component);

                componentCloner.customProperties.cloneInfo.removeCloned(component.customProperties);
            }
        });
    }

    public unlink(unlinkChildren = true)
    {
        const { model, cloneInfo, cloneInfo: { isVariant, isReference, isReferenceRoot, isDuplicate } } = this;
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

            this.disableCloneEvents();

            if (!isDuplicate)
            {
                this.unlinkCustomProperties();
            }

            cloner.cloneInfo.removeCloned(this);
            this.cloneInfo.unlink();

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

        if (this.cloneInfo.wasCloned)
        {
            this.unlink();
        }

        this.emit('disposed');

        this.cloneInfo.forEachCloned<ClonableNode>((component) => component.unlink());

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
        this.walk<ClonableNode>((component) =>
        {
            component.update();

            component.cloneInfo.forEachCloned<ClonableNode>((cloned) => cloned.updateRecursiveWithClones());
        });
    }

    public enableCloneEvents()
    {
        const { cloneInfo } = this;

        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            cloner.on('childAdded', this.onClonerChildAdded);
            cloner.on('childRemoved', this.onClonerChildRemoved);
        }
    }

    public disableCloneEvents()
    {
        const { cloneInfo } = this;

        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner)
        {
            cloner.off('childAdded', this.onClonerChildAdded);
            cloner.off('childRemoved', this.onClonerChildRemoved);
        }
    }

    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.update();

        this.emit('modelChanged', key, value, oldValue);
    };

    public onClonerChildAdded = (component: ClonableNode) =>
    {
        const { cloneMode } = this.cloneInfo;

        const copy = component.clone(
            cloneMode === CloneMode.ReferenceRoot ? CloneMode.Reference : cloneMode,
            1,
        );

        this.addChild(copy);
    };

    public onClonedChildAdded = (component: ClonableNode) =>
    {
        const copy = component.clone(
            CloneMode.Reference,
            1,
        );

        copy.parent = this;
        this.children.push(copy);

        copy.onAddedToParent();
    };

    public onClonerChildRemoved = (component: ClonableNode) =>
    {
        this.forEach<ClonableNode>((child) =>
        {
            if ((child).cloneInfo.isClonedFrom(component))
            {
                child.deleteSelf();
            }
        });
    };

    public getView<T = V>(): T
    {
        return this.view as unknown as T;
    }

    protected onAddedToParent(): void
    {
        const parent = this.getParent<ClonableNode>();

        const { cloneInfo, cloneInfo: { isReferenceOrRoot } }  = parent;
        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner && isReferenceOrRoot)
        {
            if (parent.children.length !== cloner.children.length)
            {
                cloner.onClonedChildAdded(this as unknown as ClonableNode);
            }
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: GraphNode)
    {
        const { cloneInfo, cloneInfo: { isReferenceOrRoot } } = this;
        const cloner = cloneInfo.getCloner<ClonableNode>();

        if (cloner && isReferenceOrRoot)
        {
            cloner.deleteSelf();
        }
        else
        {
            cloneInfo.forEachCloned<ClonableNode>((clonedNode) =>
            {
                const { cloneInfo: { cloner, isReferenceOrRoot } } = clonedNode;

                const isSameNode = cloner === this;

                if (isSameNode && isReferenceOrRoot)
                {
                    clonedNode.deleteSelf();
                }
            });
        }
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

        this.cloneInfo.forEachCloned<ClonableNode>((component) =>
        {
            if (component.cloneInfo.isDuplicate)
            {
                return;
            }

            if (!component.customProperties.hasAssignedToModelKey(String(modelKey)))
            {
                component.assignCustomProperty(String(modelKey), customPropertyKey);
            }
            component.update();
        });
    }

    public unAssignCustomProperty(modelKey: keyof M)
    {
        this.customProperties.unAssign(String(modelKey));

        this.update();

        this.cloneInfo.forEachCloned<ClonableNode>((component) =>
        {
            if (component.cloneInfo.isDuplicate)
            {
                return;
            }

            if (component.customProperties.hasAssignedToModelKey(String(modelKey)))
            {
                component.unAssignCustomProperty(String(modelKey));
            }
            component.update();
        });
    }

    public getAvailableCustomPropsAsArray(props: CustomProperty[] = [])
    {
        this.walk<ClonableNode>((component) =>
        {
            component.customProperties.values().forEach((array) => props.push(...array));
        }, {
            direction: 'up',
        });

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

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;
}

