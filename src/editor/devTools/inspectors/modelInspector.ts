import Color from 'color';

import type { ClonableNode } from '../../../core';
import type { Model } from '../../../core/model/model';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import type { CloneMode } from '../../../core/nodes/cloneInfo';
import { getInstance, hasInstance } from '../../../core/nodes/instances';
import { Application, getApp } from '../../core/application';
import { DevInspector } from '../devInspector';
import type { CellStyle, Column, Row } from '../tableRenderer';

export interface ModelDetail
{
    $: Model<any>;
    owner: string;
    values: string;
    parent: string;
    children: string;
    cloneMode: CloneMode;
}

export class ModelInspector extends DevInspector<ModelDetail>
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
        const app = getApp();
        const owner = getInstance<ClonableNode>(this.getCell('owner', row).value as string);

        if (owner.isCloaked)
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

        const id = this.getCell('owner', row).value as string;

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
        const details: Record<string, ModelDetail> = {};

        app.project.walk<ClonableNode>((node) =>
        {
            const model = node.model;
            const keys = Object.keys(model.ownValues);

            let values = '#empty#';

            if (keys.length > 0)
            {
                values = keys.map((key) =>
                {
                    let value = model.ownValues[key];

                    if (typeof value === 'number')
                    {
                        value = value.toFixed(1);
                    }

                    return `${key}: ${value}`;
                }).join(', ');
            }

            const detail: ModelDetail = {
                $: model,
                owner: node.id,
                parent: model.parent ? model.parent.id : '#empty#',
                children: model.children.length === 0 ? '#empty#' : model.children.map((model) => model.id).join(','),
                cloneMode: model.cloneMode,
                values,
            };

            details[model.id] = detail;
        });

        return details;
    }

    protected inspect()
    {
        const app = Application.instance;
        const models: Model<any>[] = [];

        app.project.walk<ClonableNode>((node) =>
        {
            models.push(node.model);
        });

        console.log(models);
    }

    protected indexColumnLabel()
    {
        return 'id';
    }
}
