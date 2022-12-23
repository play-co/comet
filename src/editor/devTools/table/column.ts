export type ColumnWidth = number | 'auto';

export class Column<DataType = any>
{
    public id: string;
    public name: string;
    public width: ColumnWidth;
    public isVisible: boolean;
    public rows: DataType[];

    constructor(id: string, name: string, width: ColumnWidth)
    {
        this.id = id;
        this.name = name;
        this.width = width;
        this.isVisible = true;
        this.rows = [];
    }

    public getRow(index: number)
    {
        return this.rows[index];
    }
}
