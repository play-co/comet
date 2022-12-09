export interface MenuItem
{
    label: string;
    menu?: Menu;
}

export class Menu
{
    public items: MenuItem[];

    constructor(items: MenuItem[])
    {
        this.items = items;
    }

    public getItems(): MenuItem[]
    {
        return this.items;
    }

    public addItem(item: MenuItem): void
    {
        this.items.push(item);
    }
}
