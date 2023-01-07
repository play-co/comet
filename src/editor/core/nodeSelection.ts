import type { ClonableNode } from '../../core';

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

        if (Array.isArray(item))
        {
            this.items.length = 0;
            this.items.push(...item);

            this.onSetMulti(this.items);
        }
        else
        {
            this.items.length = 0;
            this.items.push(item);

            this.onSetSingle(item);
        }

        (window as any)[this.debugId] = this.firstItem;
    }

    public add(item: T)
    {
        this.items.push(item);
        (window as any)[this.debugId] = item;

        this.onAdd(item);
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
