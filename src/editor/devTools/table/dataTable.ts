// import type { ColumnWidth } from './column';
import { type ColumnWidth, Column } from './column';

export class DataTable<Schema extends {}>
{
    public columns: Map<keyof Schema, Column>;
    public columnOrder: (keyof Schema)[];

    constructor()
    {
        this.columns = new Map();
        this.columnOrder = [];
    }

    // public test<K extends keyof Schema, V extends Schema[K]>(key: K, value: V)
    // {
    //     console.log(key, value);
    // }

    public newColumn<K extends keyof Schema>(id: K, name?: string, width: ColumnWidth = 'auto')
    {
        if (this.columns.has(id))
        {
            throw new Error(`Column with id '${String(id)}' already exists.`);
        }

        const column = new Column(String(id), name ?? String(id), width);

        this.columns.set(id, column);
        this.columnOrder.push(id);
    }

    public getColumn<K extends keyof Schema, V extends Schema[K]>(id: K)
    {
        if (this.columns.has(id))
        {
            throw new Error(`Column with id '${String(id)}' does not exist.`);
        }

        return this.columns.get(id) as Column<V>;
    }
}
