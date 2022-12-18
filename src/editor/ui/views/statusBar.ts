import { WritableStore } from './store';

export type StatusBarItemStyle = 'label' | 'value';

export interface StatusBarItemOptions
{
    text?: string;
    style?: StatusBarItemStyle;
    width?: number;
}

export class StatusBarItem
{
    public readonly style: StatusBarItemStyle;
    public readonly width: number;
    protected $label: WritableStore<string>;

    constructor(options: StatusBarItemOptions)
    {
        this.style = options.style ?? 'label';
        this.width = options.width ?? -1;
        this.$label = new WritableStore(options.text ?? '');
    }

    get $store()
    {
        return {
            label: this.$label.store,
        };
    }

    set label(value: string)
    {
        this.$label.value = value;
    }

    get label()
    {
        return this.$label.value;
    }
}

export class StatusBar
{
    protected $message: WritableStore<string>;
    protected $items: WritableStore<StatusBarItem[]>;
    protected itemsById: Map<string, StatusBarItem>;
    protected messageTimeout?: number;

    constructor()
    {
        this.$message = new WritableStore('');
        this.$items = new WritableStore([]);
        this.itemsById = new Map();
    }

    get $store()
    {
        return {
            message: this.$message.store,
            items: this.$items.store,
        };
    }

    public clearMessage()
    {
        this.$message.value = '';
    }

    public setMessage(message: string, clearAfterMs = 0)
    {
        this.$message.value = message;

        if (clearAfterMs > 0)
        {
            clearTimeout(this.messageTimeout);

            this.messageTimeout = setTimeout(() =>
            {
                this.clearMessage();
            }, clearAfterMs) as unknown as number;
        }
    }

    public addItem(id: string, options: StatusBarItemOptions = {})
    {
        const item = new StatusBarItem(options);

        this.itemsById.set(id, item);

        this.$items.value = [...this.$items.value, item];

        return item;
    }

    public getItem(id: string)
    {
        const item = this.itemsById.get(id);

        if (!item)
        {
            throw new Error(`Item with id ${id} not found`);
        }

        return item;
    }
}
