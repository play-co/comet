import EventEmitter from 'eventemitter3';

import { newGraphNodeId } from '../factory';

export type GraphNodeEvents = 'childAdded' | 'childRemoved' | 'disposed';

export interface WalkOptions
{
    includeSelf?: boolean;
    depth: number;
    cancel: boolean;
    direction: 'up' | 'down';
    data?: any;
}

export const defaultWalkOptions: WalkOptions = {
    includeSelf: true,
    depth: 0,
    cancel: false,
    direction: 'down',
};

export type GraphNodeConstructor = {
    new (id?: string): GraphNode;
    nodeType: () => string;
};

export abstract class GraphNode<E extends string = string> extends EventEmitter<GraphNodeEvents | E>
{
    public id: string;
    public parent?: GraphNode;
    public children: GraphNode[];

    constructor(id?: string)
    {
        super();

        this.id = id ?? newGraphNodeId(this.nodeType());
        this.children = [];
    }

    public abstract nodeType(): string;

    public dispose()
    {
        // subclass
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

    public setParent(parent: GraphNode)
    {
        if (this.parent)
        {
            this.parent.removeChild(this);
        }

        this.parent = parent;

        parent.children.push(this);
        parent.emit('childAdded', this);

        this.onAddedToParent();
    }

    public addChild(component: GraphNode<string>)
    {
        if (component === this)
        {
            throw new Error(`"Cannot add ${this.nodeType} to self"`);
        }

        component.setParent(this);
    }

    public removeChild(component: GraphNode)
    {
        const { children } = this;

        const index = children.indexOf(component);

        if (index > -1)
        {
            children.splice(index, 1);

            delete component.parent;

            this.emit('childRemoved', component);

            component.onRemovedFromParent(this);
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
        return node.hasParent(this);
    }

    public hasParent(node: GraphNode)
    {
        const opts: Partial<WalkOptions> = {
            data: false,
        };

        this.walk((parentNode, options) =>
        {
            if (parentNode === node)
            {
                options.cancel = true;
                options.data = true;
            }
        }, opts);

        return opts.data as boolean;
    }

    public walk<T extends GraphNode>(
        fn: (component: T, options: WalkOptions) => void,
        options: Partial<WalkOptions> = {},
    )
    {
        const currentOptions = {
            ...defaultWalkOptions,
            ...options,
        };
        const { includeSelf, depth, direction, cancel } = currentOptions;

        if (cancel)
        {
            return;
        }

        if (includeSelf)
        {
            fn(this as unknown as T, currentOptions);
        }

        if (direction === 'down')
        {
            this.children.forEach((child) =>
                child.walk(fn, {
                    ...currentOptions,
                    depth: depth + 1,
                    includeSelf: true,
                }),
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
    }

    public containsChild<T extends GraphNode>(component: T)
    {
        return this.children.indexOf(component) > -1;
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
