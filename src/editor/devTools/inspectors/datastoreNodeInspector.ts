import Color from 'color';

import type { ClonableNode } from '../../../core';
import { getInstance, hasInstance } from '../../../core/nodes/instances';
import { Application, getApp } from '../../core/application';
import Events from '../../events';
import { DevInspector } from '../devInspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from '../tableRenderer';

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
        Events.$('selection.hierarchy', () => this.render());

        this.render();
    }

    protected getDetails()
    {
        const datastore = Application.instance.datastore;
        const details: Record<string, DatastoreNodeDetail> = {};

        if (!datastore.isConnected())
        {
            return {};
        }

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
        const app = getApp();
        const currentCell = this.getCell(column.id, row);

        if (currentCell.value === '#empty#')
        {
            cellStyle.fontStyle = 'italic';
            cellStyle.fontColor = '#aaa';
            cellStyle.text = 'none';
        }

        const id = this.getCell(tableIndexKey, row).value as string;

        if (hasInstance(id))
        {
            const node = getInstance<ClonableNode>(id);

            if (app.selection.hierarchy.shallowContains(node))
            {
                cellStyle.fillColor = Color(this.painter.backgroundColor).darken(0.3).hex();
                cellStyle.fontStyle = 'bold';
            }
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
