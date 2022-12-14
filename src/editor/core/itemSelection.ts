export abstract class ItemSelection<T>
{
    public readonly items: T[];

    constructor()
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
    }

    public add(item: T)
    {
        this.items.push(item);

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

        this.onDeselect();

        this.items.length = 0;
    }

    public shallowContains(item: T)
    {
        return this.items.indexOf(item) > -1;
    }

    public abstract deepContains(item: T): boolean;

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

    public get firstNode(): T
    {
        const { items } = this;

        if (items.length === 0)
        {
            throw new Error('Cannot get first node, selection is empty');
        }

        return items[0];
    }

    public get lastNode(): T
    {
        const { items } = this;

        if (items.length === 0)
        {
            throw new Error('Cannot get last node, selection is empty');
        }

        return items[items.length - 1];
    }
}
