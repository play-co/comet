import Color from 'color';

import type { ClonableNode } from '../../../core';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import { getInstance, hasInstance } from '../../../core/nodes/instances';
import { Application, getApp } from '../../core/application';
import { DevInspector } from '../devInspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from '../tableRenderer';

export interface GraphNodeDetail
{
    $: ClonableNode;
    _depth: number;
    cloaked: boolean;
    cId: number;
    name: string;
    parent: string;
    children: string;
    model: string;
    mode: string;
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

    protected getDetails()
    {
        const app = Application.instance;
        const details: Record<string, GraphNodeDetail> = {};

        app.project.walk<ClonableNode>((node, options) =>
        {
            // let pad = '';

            // if (options.depth > 0)
            // {
            //     pad = `${'│'.repeat(options.depth - 1)}└`;
            // }

            const detail: GraphNodeDetail = {
                $: node,
                _depth: options.depth,
                cId: node.creationId,
                name:  `${node.model.getValue<string>('name')}`,
                parent: node.parent ? node.parent.id : '#empty#',
                children: node.children.length === 0 ? '#empty#' : node.children.map((node) => node.id).join(','),
                mode: node.cloneInfo.shortMode,
                cloner: node.cloneInfo.cloner ? node.cloneInfo.cloner.id : '#empty#',
                cloned: node.cloneInfo.cloned ? node.cloneInfo.cloned.map((node) => node.id).join(',') : '#empty#',
                cloaked: node.isCloaked,
                model: node.model.id,
            };

            details[node.id] = detail;
        });

        return details;
    }

    public onCellStyle = (row: Row, column: Column, cellStyle: CellStyle) =>
    {
        const app = getApp();

        if (!app.project.isReady)
        {
            return;
        }

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

            if (node.isMetaNode)
            {
                cellStyle.fillColor = Color(cellStyle.fillColor).darken(0.1).hex();
            }
        }
    };

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

    protected onClickRow(row: Row)
    {
        const app = getApp();
        const value = super.onClickRow(row);

        if (value && app.view.rootNode.contains(value))
        {
            app.selection.hierarchy.set(value);
        }
        else
        {
            app.selection.project.set(value);
        }
    }
}
