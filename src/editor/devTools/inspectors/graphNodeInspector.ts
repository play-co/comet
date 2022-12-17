import Color from 'color';

import type { ClonableNode } from '../../../core';
import { Application } from '../../core/application';
import { DevInspector } from '../devInspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from '../tableRenderer';

export interface GraphNodeDetail
{
    _depth: number;
    name: string;
    index: number;
    parent: string;
    children: string;
    cloaked: boolean;
}

export class GraphNodeInspector extends DevInspector<GraphNodeDetail>
{
    protected init(): void
    {
        setInterval(() =>
        {
            this.render();
        }, 500);
    }

    public onCellStyle = (row: Row, column: Column, cellStyle: CellStyle) =>
    {
        const currentCell = this.getCell(column.id, row);
        const cloakedCell = this.getCell('cloaked', row);

        if (cloakedCell.value as boolean === true)
        {
            cellStyle.fillColor = Color(this.painter.backgroundColor).darken(0.35).hex();
            cellStyle.fontColor = '#aaa';
        }

        if (currentCell.value === '#empty#')
        {
            cellStyle.fontStyle = 'italic';
            cellStyle.fontColor = '#aaa';
            cellStyle.text = 'none';
        }

        if (column.id === tableIndexKey)
        {
            const depth = this.getCell('_depth', row).value as number;

            let pad = '';

            if (depth > 0)
            {
                pad = `${'│'.repeat(depth - 1)}└`;
            }

            cellStyle.text = `${pad}${currentCell.value}`;
        }
    };

    protected getDetails()
    {
        const app = Application.instance;
        const details: Record<string, GraphNodeDetail> = {};

        app.project.walk<ClonableNode>((node, options) =>
        {
            const detail: GraphNodeDetail = {
                _depth: options.depth,
                name: node.model.getValue<string>('name'),
                index: node.index,
                parent: node.parent ? node.parent.id : '#empty#',
                children: node.children.length === 0 ? '#empty#' : node.children.map((node) => node.id).join(','),
                cloaked: node.isCloaked,
            };

            details[node.id] = detail;
        });

        return details;
    }

    protected inspect()
    {
        const app = Application.instance;
        const nodes: ClonableNode[] = [];

        app.project.walk<ClonableNode>((node) =>
        {
            nodes.push(node);
        });

        console.log(nodes);
    }

    protected indexColumnLabel()
    {
        return 'id';
    }
}
