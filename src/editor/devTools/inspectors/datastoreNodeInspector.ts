import { Application } from '../../core/application';
import Events from '../../events';
import { DevInspector } from '../devInspector';
import type { CellStyle, Column, Row } from '../tableRenderer';

export interface DatastoreNodeDetail
{
    parent: string;
    children: string;
}

export class DatastoreNodeInspector extends DevInspector<DatastoreNodeDetail>
{
    protected init(): void
    {
        Events.$('datastore.node', () => this.scrollToEnd());

        this.update();
    }

    protected getDetails()
    {
        const datastore = Application.instance.datastore;
        const details: Record<string, DatastoreNodeDetail> = {};

        const project = datastore.toProjectSchema();

        for (const [nodeId, node] of Object.entries(project.nodes))
        {
            details[nodeId] = {
                parent: node.parent ? node.parent : '#empty#',
                children: node.children.length === 0 ? '#empty#' : node.children.join(','),
            };
        }

        return details;
    }

    public onCellStyle = (row: Row, column: Column, cellStyle: CellStyle) =>
    {
        const currentCell = this.getCell(column.id, row);

        if (currentCell.value === '#empty#')
        {
            cellStyle.fontStyle = 'italic';
            cellStyle.fontColor = '#aaa';
            cellStyle.text = 'none';
        }
    };

    protected inspect()
    {
        const datastore = Application.instance.datastore;

        console.log(datastore.toProjectSchema());
    }

    protected indexColumnLabel()
    {
        return 'id';
    }
}
