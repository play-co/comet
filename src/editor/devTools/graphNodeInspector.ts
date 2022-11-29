import Color from 'color';

import type { ClonableNode } from '../../core/nodes/abstract/clonableNode';
import { Application } from '../core/application';
import { DevInspector } from './inspector';
import type { CellStyle, Column, Row } from './tableRenderer';

export interface GraphNodeDetail
{
    depth: number;
    index: number;
    parent: string;
    children: string;
    cloaked: boolean;
}

export class GraphNodeInspector extends DevInspector<GraphNodeDetail>
{
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
    };

    protected getDetails()
    {
        const app = Application.instance;
        const details: Record<string, GraphNodeDetail> = {};

        app.project.walk<ClonableNode>((node, options) =>
        {
            const detail: GraphNodeDetail = {
                depth: options.depth,
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
