import { type Model, type ModelBase, createModel } from '../../model/model';
import { ModelSchema } from '../../model/schema';
import { type Clonable, CloneInfo, CloneMode } from '../cloneInfo';
import { getAllCloned, getDependants, getDependencies, getRestoreDependencies } from '../cloneUtils';
import { sortNodesByDepth } from '../const';
import type {
    CustomProperty,
    CustomPropertyType,
    CustomPropertyValueType,
} from '../customProperties';
import { GraphNode } from './graphNode';
import type { MetaNode } from './metaNode';

export type ClonableNodeConstructor = {
    new (options: NewNodeOptions<any>): ClonableNode<any, any>;
};

export type ClonableNodeModel = ModelBase;

export const clonableNodeSchema = new ModelSchema<ClonableNodeModel>({
    name: {
        defaultValue: '',
        category: 'node',
    },
});

export interface NewNodeOptions<M>
{
    id?: string;
    model?: Partial<M>;
    cloneInfo?: CloneInfo;
}

export abstract class ClonableNode<
    /** Model */
    M extends ClonableNodeModel = ClonableNodeModel,
    /** View */
    V extends object = object,
> extends GraphNode implements Clonable
{
    public model: Model<M> & M;
    public view: V;

    public cloneInfo: CloneInfo;
    public defineCustomProperties: Map<string, CustomProperty>;
    public assignedCustomProperties: Map<keyof M, string>;
    public isCloaked: boolean;
    public deferredCloner?: string;

    constructor(
        options: NewNodeOptions<M> = {},
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

        this.isCloaked = false;
        this.defineCustomProperties = new Map();
        this.assignedCustomProperties = new Map();

        this.view = this.createView();
        this.initView();

        this.model.bind(this.onModelModified);

        this.initCloning();

        this.init();
    }

    protected abstract initView(): void;

    public initCloning()
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
                this.model.link(sourceModel, this.cloneInfo.cloneMode);

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

    public clone<T extends ClonableNode>(cloneMode: CloneMode = CloneMode.ReferenceRoot, depth = 0): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as ClonableNodeConstructor;

        const cloneInfo = new CloneInfo(cloneMode, this);

        const node = new Ctor(
            {
                cloneInfo,
            },
        );

        this.forEach<ClonableNode>((child) =>
        {
            if (child.isCloaked)
            {
                return;
            }

            let childCloneMode = cloneMode;

            if (cloneMode === CloneMode.ReferenceRoot)
            {
                childCloneMode = CloneMode.Reference;
            }

            if (cloneMode === CloneMode.VariantRoot)
            {
                childCloneMode = CloneMode.Variant;
            }

            const childNode = child.clone(childCloneMode, depth + 1);

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
            }
            else
            {
                model.flatten();
            }

            cloner.cloneInfo.removeCloned(this);
            this.cloneInfo.unlink(this);

            this.update();
        }
    }

    public dispose()
    {
        super.dispose();

        this.model.unbind(this.onModelModified);

        if (this.cloneInfo.isClone)
        {
            this.unlink();
        }
    }

    public isReferencingNode<T extends GraphNode>(refNode: T): boolean
    {
        if (super.isReferencingNode(refNode))
        {
            return true;
        }

        const node = refNode.asClonableNode();

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
            this.postUpdateView();
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

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onModelModified = <T>(key: string, value: T, oldValue: T) =>
    {
        this.update();
    };

    protected onAddedToParent(): void
    {
        const { parent } = this;

        if (parent)
        {
            this.addViewToParent(parent.cast());
        }
    }

    protected abstract addViewToParent(parent: ClonableNode): void;

    protected onRemovedFromParent(oldParent: GraphNode): void
    {
        this.removeViewFromParent(oldParent.cast());
    }

    protected abstract removeViewFromParent(parent: ClonableNode): void;

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

                this.cloneInfo.forEachCloned<ClonableNode>((node) =>
                {
                    if (nodes.indexOf(node) === -1)
                    {
                        nodes.push(node);
                    }
                });
            }
        }
        else
        {
            nodes.push(...getAllCloned(this as unknown as ClonableNode));
        }

        sortNodesByDepth(nodes);

        return nodes;
    }

    public getCloneRoot(): ClonableNode
    {
        return this.walk<ClonableNode, { node?: ClonableNode }>((node, options) =>
        {
            const isParentMetaNode = node.parent ? node.getParent<ClonableNode>().isMetaNode : false;

            if (node.cloneInfo.isRoot || isParentMetaNode)
            {
                options.data.node = node;
                options.cancel = true;
            }
        }, {
            direction: 'up',
            data: {
                node: this,
            },
        }).node as ClonableNode;
    }

    public getMetaNode(): MetaNode
    {
        return this.walk<ClonableNode, { node: ClonableNode }>((node, options) =>
        {
            if (node.isMetaNode)
            {
                options.data.node = node.cast<MetaNode>();
                options.cancel = true;
            }
        }, {
            includeSelf: false,
            direction: 'up',
            data: {
                node: this,
            },
        }).node as MetaNode;
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

    public getCloneTreeAncestors(): ClonableNode[]
    {
        const nodes = this.getCloneAncestors();
        const array: ClonableNode[] = [];

        nodes.splice(0, 0, this.cast());
        nodes.forEach((node) =>
        {
            const parents = node.getParents<ClonableNode>();

            parents.push(node);
            parents.reverse();

            array.push(...parents);
        });

        return array;
    }

    /**
     * return the nodes which depend on this node, eg. clones or children
     * @returns array of nodes
     */
    public getDependants(): ClonableNode[]
    {
        const array = getDependants(this.cast());

        sortNodesByDepth(array);

        return array;
    }

    /**
     * return the nodes which are required for this node to exist
     * @returns array of nodes
     */
    public getDependencies(): ClonableNode[]
    {
        const array = getDependencies(this.cast());

        sortNodesByDepth(array);

        return array;
    }

    /**
     * return the nodes which are required for this node to exist
     * @returns array of nodes
     */
    public getRestoreDependencies(): ClonableNode[]
    {
        let array = getRestoreDependencies(this.getCloneRoot());

        if (this.cloneInfo.isReference)
        {
            const cloneTarget = this.getCloneTarget();
            const dependants = cloneTarget.getDependants();

            dependants.forEach((node) => array.push(...node.getDependencies()));
            array.push(...dependants);
        }

        array = Array.from(new Set(array));

        sortNodesByDepth(array);

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

    public getAssignedCustomProperty(modelKey: string)
    {
        return this.assignedCustomProperties.get(modelKey);
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
        const modelKeys: string[] = [];

        this.assignedCustomProperties.forEach((customKey, modelKey) =>
        {
            if (customKey === assignedCustomKey)
            {
                modelKeys.push(String(modelKey));
            }
        });

        return modelKeys;
    }

    public indexOf(node: GraphNode, includeCloakedNodes = false)
    {
        if (includeCloakedNodes)
        {
            return super.indexOf(node);
        }

        return this.children.filter((node) => !(node as unknown as ClonableNode).isCloaked).indexOf(node);
    }

    public cloak()
    {
        this.isCloaked = true;
        this.onCloaked();
    }

    public uncloak()
    {
        this.isCloaked = false;
        this.onUncloaked();
    }

    protected onCloaked()
    {
        // subclasses
    }

    protected onUncloaked()
    {
        // subclasses
    }

    public get isMetaNode()
    {
        return false;
    }

    public get isSceneNode()
    {
        return !this.isMetaNode;
    }

    public abstract modelSchema(): ModelSchema<M>;

    public abstract createView(): V;

    public abstract updateView(): void;

    public postUpdateView()
    {
        //
    }
}

