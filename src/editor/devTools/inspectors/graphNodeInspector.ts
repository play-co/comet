import Color from 'color';

import type { ClonableNode } from '../../../core';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import type { CloneMode } from '../../../core/nodes/cloneInfo';
import { getInstance, hasInstance } from '../../../core/nodes/instances';
import { Application, getApp } from '../../core/application';
import { DevInspector } from '../devInspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from '../tableRenderer';

export interface GraphNodeDetail
{
    $: ClonableNode;
    _depth: number;
    _cloaked: boolean;
    name: string;
    parent: string;
    children: string;
    model: string;
    cloneMode: CloneMode;
    cloner: string;
    cloned: string;
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
        const app = getApp();
        const currentCell = this.getCell(column.id, row);
        const cloakedCell = this.getCell('_cloaked', row);

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

        // if (column.id === tableIndexKey)
        // {
        //     const depth = this.getCell('_depth', row).value as number;

        //     let pad = '';

        //     if (depth > 0)
        //     {
        //         pad = `${'│'.repeat(depth - 1)}└`;
        //     }

        //     cellStyle.text = `${pad}${currentCell.value}`;
        // }

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

    protected getDetails()
    {
        const app = Application.instance;
        const details: Record<string, GraphNodeDetail> = {};

        app.project.walk<ClonableNode>((node, options) =>
        {
            const detail: GraphNodeDetail = {
                $: node,
                _depth: options.depth,
                _cloaked: node.isCloaked,
                name: node.model.getValue<string>('name'),
                parent: node.parent ? node.parent.id : '#empty#',
                children: node.children.length === 0 ? '#empty#' : node.children.map((node) => node.id).join(','),
                cloneMode: node.cloneInfo.cloneMode,
                cloner: node.cloneInfo.cloner ? node.cloneInfo.cloner.id : '#empty#',
                cloned: node.cloneInfo.cloned ? node.cloneInfo.cloned.map((node) => node.id).join(',') : '#empty#',
                model: node.model.id,
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
