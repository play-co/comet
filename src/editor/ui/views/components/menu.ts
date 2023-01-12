import type { Action } from '../../../core/action';

export interface MenuItem
{
    id?: string;
    label: string;
    icon?: string;
    style?: 'separator' | 'prompt';
    data?: any;
    isEnabled?: boolean;
    isHidden?: boolean;
    menu?: Menu;
    onClick?: (item: MenuItem) => void;
    action?: Action;
}

export type RefreshCallback = (item: MenuItem, index: number, array: MenuItem[]) => false | void;

export const separator: MenuItem = {
    label: '-',
    style: 'separator',
};

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

        this.items.forEach((item, i, array) =>
        {
            if (item.action)
            {
                item.isEnabled = item.action.shouldRun();
            }

            if (refreshFn)
            {
                refreshFn(item, i, array);
            }

            if (item.menu)
            {
                item.menu.refresh();
            }
        });
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
