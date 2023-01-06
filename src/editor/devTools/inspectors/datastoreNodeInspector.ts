import Color from 'color';

import type { ClonableNode } from '../../../core';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import { getInstance, hasInstance } from '../../../core/nodes/instances';
import { getNodeSchema } from '../../../core/nodes/schema';
import { Application, getApp } from '../../core/application';
import Events from '../../events';
import { DevInspector } from '../devInspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from '../tableRenderer';

export interface DatastoreNodeDetail
{
    $: string;
    parent: string;
    children: string;
    cloneMode: string;
    cloner: string;
    cloned: string;
    model: string;
}

export class DatastoreNodeInspector extends DevInspector<DatastoreNodeDetail>
{
    protected init(): void
    {
        Events.$('datastore.node', () => this.scrollToEnd());
        Events.$('selection.', () => this.render());

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
                $: nodeId,
                parent: node.parent ? node.parent : '#empty#',
                children: node.children.length === 0 ? '#empty#' : node.children.join(','),
                cloneMode: node.cloneInfo.cloneMode,
                cloner: node.cloneInfo.cloner ?? '#empty#',
                cloned: node.cloneInfo.cloned.length ? node.cloneInfo.cloned.join(',') : '#empty#',
                model: Object.keys(node.model).join(','),
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
                cellStyle.fillColor = Color('#2eb2c8').hex();
                cellStyle.fontStyle = 'bold';
                cellStyle.fontColor = 'white';
            }

            if (app.selection.project.shallowContains(node.cast<MetaNode>()))
            {
                cellStyle.fillColor = Color('#2e66c8').hex();
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

    protected getRowValue(row: Row)
    {
        const value = super.getRowValue(row);

        if (value)
        {
            return getNodeSchema(getInstance(value));
        }

        return undefined;
    }
}
