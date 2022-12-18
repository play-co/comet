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

export type RefreshCallback = (item: MenuItem, index: number, array: MenuItem[]) => void;

export class Menu
{
    protected items: MenuItem[];
    protected refreshFn?: RefreshCallback;

    constructor(items: MenuItem[], refreshFn?: RefreshCallback)
    {
        this.items = items;
        this.refreshFn = refreshFn;
    }

    public refresh()
    {
        const { refreshFn } = this;

        if (refreshFn)
        {
            this.items.forEach((item, i, array) =>
            {
                refreshFn(item, i, array);

                if (item.menu)
                {
                    item.menu.refresh();
                }
            });
        }
    }

    public getItems(): MenuItem[]
    {
        this.refresh();

        return this.items.filter((item) => item.isHidden !== true);
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
