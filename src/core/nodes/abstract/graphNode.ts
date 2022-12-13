import { type WalkOptions, type WalkReturnData, defaultWalkOptions } from '../const';
import { newId } from '../instances';
import type { ClonableNode } from './clonableNode';

export abstract class GraphNode
{
    public id: string;
    public parent?: GraphNode;
    public children: GraphNode[];
    public created: number;

    constructor(id?: string)
    {
        this.id = id ?? newId(this.nodeType());
        this.children = [];
        this.created = Date.now();
    }

    get hasChildren()
    {
        return this.children.length > 0;
    }

    get index()
    {
        return this.parent ? this.parent.indexOf(this) : -1;
    }

    public toString()
    {
        return this.id;
    }

    public abstract nodeType(): string;

    public cast<T extends GraphNode = GraphNode>()
    {
        return this as unknown as T;
    }

    public asClonableNode()
    {
        return this.cast<ClonableNode>();
    }

    public dispose()
    {
        // subclasses
    }

    public deleteSelf()
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
            this.dispose();
        }
    }

    public getParent<T extends GraphNode>()
    {
        return this.parent as unknown as T;
    }

    public getRoot<T extends GraphNode>(): T
    {
        if (!this.parent)
        {
            return this as unknown as T;
        }

        let ref: GraphNode | undefined = this.parent;

        while (ref)
        {
            ref = ref.parent;
        }

        return ref as unknown as T;
    }

    public isReferencingNode<T extends GraphNode>(refNode: T)
    {
        if (refNode.contains(this) || this.contains(refNode))
        {
            return true;
        }

        return false;
    }

    public getParents<T extends GraphNode>(breakType = 'Scene', includeBreak = false): T[]
    {
        const nodes: T[] = [];

        let node = this.parent;

        while (node)
        {
            if (node.nodeType() === breakType)
            {
                if (includeBreak)
                {
                    nodes.push(node as unknown as T);
                }
                break;
            }
            nodes.push(node as unknown as T);
            node = node.parent;
        }

        nodes.reverse();

        return nodes;
    }

    public indexOf(node: GraphNode)
    {
        return this.children.indexOf(node);
    }

    public setParent(parent: GraphNode)
    {
        if (parent.children.indexOf(this) > -1)
        {
            throw new Error(`"${parent.id}" already contains child "${this.id}"`);
        }

        this.parent = parent;

        parent.children.push(this);

        this.onAddedToParent();
    }

    public addChild(node: GraphNode)
    {
        if (node === this)
        {
            throw new Error(`"Cannot add ${this.nodeType} to self"`);
        }

        node.setParent(this);
    }

    public addChildAt(node: GraphNode, index: number)
    {
        const maxIndex = this.children.length - 1;

        if (index > maxIndex)
        {
            throw new Error(`Cannot add child past max index ${maxIndex}`);
        }

        if (this.children.indexOf(node) > -1)
        {
            throw new Error(`"${this.id}" already contains child "${node.id}`);
        }

        node.parent = this;

        this.children.splice(index, 0, node);

        node.onAddedToParent();
    }

    public setChildIndex(node: GraphNode, index: number)
    {
        const { children } = this;
        const maxIndex = this.children.length;

        if (index > maxIndex)
        {
            throw new Error(`"${this.id}" Cannot add child past max index ${maxIndex}`);
        }

        if (children.indexOf(node) === -1)
        {
            throw new Error(`"${this.id}" does not contain child "${node.id}`);
        }

        const currentIndex = children.indexOf(node);

        children.splice(currentIndex, 1);

        node.onRemovedFromParent(this);

        if (index === maxIndex)
        {
            children.push(node);
        }
        else if (index <= currentIndex)
        {
            children.splice(index, 0, node);
        }
        else
        {
            children.splice(index - 1, 0, node);
        }

        node.onAddedToParent();
    }

    public reorderChildren(childIds: string[])
    {
        const map: Map<string, GraphNode> = new Map();

        this.children.forEach((node) => map.set(node.id, node));
        this.children = childIds.map((id) =>
        {
            const node = map.get(id);

            if (!node)
            {
                throw new Error(`Cannot reorder as "${this.id}" does not contain child "id"`);
            }

            return node;
        });
    }

    public isSiblingOf(node: GraphNode)
    {
        if (this.parent)
        {
            return this.parent.children.indexOf(node) > -1;
        }

        return false;
    }

    public removeChild(node: GraphNode)
    {
        const { children } = this;

        const index = children.indexOf(node);

        if (index > -1)
        {
            children.splice(index, 1);

            delete node.parent;

            node.onRemovedFromParent(this);
        }
        else
        {
            throw new Error('"Cannot remove child which is not in parent"');
        }
    }

    public getChildAt<T extends GraphNode>(index: number): T
    {
        return this.children[index] as T;
    }

    public forEach<T extends GraphNode>(fn: (child: T, index: number, array: T[]) => void)
    {
        this.children.forEach((child, i, array) => fn(child as T, i, array as T[]));
    }

    public contains(node: GraphNode): boolean
    {
        return this.walk<GraphNode, { hasNode?: boolean }>((childNode, options) =>
        {
            if (childNode === node)
            {
                options.cancel = true;
                options.data.hasNode = true;
            }
        }, { includeSelf: false }).hasNode === true;
    }

    public hasParent(node: GraphNode): boolean
    {
        return this.walk<GraphNode, { hasParent?: boolean }>((parentNode, options) =>
        {
            if (parentNode === node)
            {
                options.cancel = true;
                options.data.hasParent = true;
            }
        }, { direction: 'up', includeSelf: false }).hasParent === true;
    }

    public walk<NodeType extends GraphNode, ReturnType extends WalkReturnData = {}>(
        fn: (node: NodeType, options: WalkOptions) => void,
        options: Partial<WalkOptions> = {},
    ): ReturnType
    {
        const currentOptions = {
            ...defaultWalkOptions,
            data: {},
            ...options,
        };

        const { includeSelf, depth, direction, cancel } = currentOptions;

        // prevent traversing deeper
        if (cancel)
        {
            return currentOptions.data as ReturnType;
        }

        if (includeSelf)
        {
            fn(this as unknown as NodeType, currentOptions);
        }

        // cancel if current call requested
        if (currentOptions.cancel)
        {
            return currentOptions.data as ReturnType;
        }

        if (direction === 'down')
        {
            this.children.forEach((child) =>
            {
                child.walk(fn, {
                    ...currentOptions,
                    depth: depth + 1,
                    includeSelf: true,
                });
            },
            );
        }
        else
        if (this.parent)
        {
            this.parent.walk(fn, {
                ...currentOptions,
                depth: depth - 1,
                includeSelf: true,
            });
        }

        return currentOptions.data as ReturnType;
    }

    public containsChild<T extends GraphNode>(node: T)
    {
        return this.children.indexOf(node) > -1;
    }

    public getAllChildren<T extends GraphNode>(): T[]
    {
        return this.walk<T, {nodes: T[]}>((node, options) =>
        {
            options.data.nodes.push(node);
        }, {
            data: {
                nodes: [],
            },
            includeSelf: false,
        }).nodes;
    }

    protected onAddedToParent(): void
    {
        // subclasses
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemovedFromParent(oldParent: GraphNode)
    {
        // subclasses
    }
}
