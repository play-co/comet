import type { ClonableNode } from '../../core';

export function isSiblingOf(targetNode: ClonableNode, nodes: ClonableNode[])
{
    return nodes.some((node) => node.isSiblingOf(targetNode));
}

export function groupSiblings(nodes: ClonableNode[])
{
    type Group = {
        depth: number;
        nodes: ClonableNode[];
    };

    const siblings: Group[] = [];

    for (let i = 0; i < nodes.length; i++)
    {
        const sourceNode = nodes[i];
        const group: Group = { depth: sourceNode.getDepth(), nodes: [sourceNode] };

        siblings.push(group);

        for (let j = 0; j < nodes.length; j++)
        {
            const targetNode = nodes[j];

            if (sourceNode.isSiblingOf(targetNode) && sourceNode !== targetNode)
            {
                group.nodes.push(targetNode);
            }
        }
    }

    siblings.sort((a, b) =>
    {
        if (a.nodes.length !== b.nodes.length)
        {
            return b.nodes.length - a.nodes.length;
        }

        return a.depth - b.depth;
    });

    console.log(siblings[0], siblings);

    return siblings[0].nodes;
}

export abstract class NodeSelection<T extends ClonableNode>
{
    public readonly items: T[];

    constructor(protected readonly debugId: string)
    {
        this.items = [];
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onSetSingle(item: T) { /** */ }
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onSetMulti(items: T[]) { /** */ }
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onAdd(item: T) { /** */ }
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onRemove(item: T) { /** */ }
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onDeselect() { /** */ }

    public update()
    {
        if (this.items.length > 0)
        {
            this.set([...this.items]);
        }
    }

    public set(item: T | T[])
    {
        if (!this.isEmpty)
        {
            this.deselect();
        }

        const items = Array.isArray(item) ? item : [item];

        this.items.length = 0;

        const siblings = groupSiblings(items);

        this.items.push(...siblings as T[]);

        if (items.length > 1)
        {
            // set multi
            this.onSetMulti(this.items);
        }
        else
        {
            // set single
            this.onSetSingle(items[0]);
        }

        (window as any)[this.debugId] = this.firstItem;
    }

    public add(item: T)
    {
        const isSibling = isSiblingOf(item, this.items);

        if (isSibling)
        {
            this.items.push(item);
            this.onAdd(item);
        }
        else
        {
            this.set(item);
        }

        // todo: remove this, only for debugging
        (window as any)[this.debugId] = item;
    }

    public remove(item: T)
    {
        const index = this.items.indexOf(item);

        if (index === -1)
        {
            throw new Error(`Cannot remove item "${item}" from selection, not found`);
        }

        this.items.splice(index, 1);

        this.onRemove(item);
    }

    public deselect()
    {
        if (this.isEmpty)
        {
            return;
        }

        this.items.length = 0;

        this.onDeselect();
    }

    public deepContains(node: ClonableNode)
    {
        for (const selectedNode of this.items)
        {
            const hasNode = selectedNode.walk<ClonableNode, {hasNode: boolean}>((subNode, options) =>
            {
                if (subNode === node)
                {
                    options.cancel = true;
                    options.data.hasNode = true;
                }
            }).hasNode;

            if (hasNode)
            {
                return true;
            }
        }

        return false;
    }

    public shallowContains(item: T)
    {
        return this.items.indexOf(item) > -1;
    }

    public onlyContains(item: T)
    {
        return this.items.length === 1 && this.items[0] === item;
    }

    public forEach(fn: (item: T, i: number) => void)
    {
        this.items.forEach(fn);
    }

    public get length()
    {
        return this.items.length;
    }

    public get isEmpty()
    {
        return this.items.length === 0;
    }

    public get hasSelection()
    {
        return this.items.length > 0;
    }

    public get isSingle()
    {
        return this.items.length === 1;
    }

    public get isMulti()
    {
        return this.items.length > 1;
    }

    public get firstItem(): T
    {
        const { items } = this;

        if (items.length === 0)
        {
            throw new Error('Cannot get first node, selection is empty');
        }

        return items[0];
    }

    public get lastItem(): T
    {
        const { items } = this;

        if (items.length === 0)
        {
            throw new Error('Cannot get last node, selection is empty');
        }

        return items[items.length - 1];
    }

    public isSelected(ctor: Function)
    {
        return this.items.some((item) => item instanceof ctor);
    }

    public findUnique()
    {
        const valid = this.items.filter((selectedNode) =>
        {
            const result = selectedNode.walk<ClonableNode, {include: boolean}>((node, options) =>
            {
                if (node.isMetaNode)
                {
                    options.cancel = true;

                    return;
                }

                if ((this.items as ClonableNode[]).indexOf(node) > -1)
                {
                    options.data.include = false;
                    options.cancel = true;
                }
            }, {
                includeSelf: false,
                direction: 'up',
                data: {
                    include: true,
                },
            }).include;

            return result;
        });

        return valid;
    }
}
