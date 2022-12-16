export interface MenuItem
{
    label: string;
    icon?: string;
    style?: 'separator' | 'prompt';
    data?: any;
    isEnabled?: boolean;
    isHidden?: boolean;
    menu?: Menu;
    onClick?: (item: MenuItem) => void;
}

export type FilterCallback = (item: MenuItem) => void;

export class Menu
{
    protected items: MenuItem[];
    protected filter?: FilterCallback;

    constructor(items: MenuItem[], filter?: FilterCallback)
    {
        this.items = items;
        this.filter = filter;
    }

    public getItems(): MenuItem[]
    {
        if (this.filter)
        {
            this.items.forEach(this.filter);
        }

        return this.items.filter((a) => a.isHidden !== true);
    }

    public addItem(item: MenuItem): void
    {
        this.items.push(item);
    }

    public hasSubMenus()
    {
        return this.items.some((item) => item.menu !== undefined);
    }

    public insertItem(item: MenuItem, index = 0): void
    {
        this.items.splice(index, 0, item);
    }
}
