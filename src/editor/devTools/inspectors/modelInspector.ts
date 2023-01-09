import Color from 'color';

import type { ClonableNode } from '../../../core';
import type { Model } from '../../../core/model/model';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import { shortCloneMode } from '../../../core/nodes/cloneInfo';
import { getInstance, hasInstance } from '../../../core/nodes/instances';
import { Application, getApp } from '../../core/application';
import { DevInspector } from '../devInspector';
import type { CellStyle, Column, Row } from '../tableRenderer';

export interface ModelDetail
{
    $: Model<any>;
    owner: string;
    values: {};
    parent: string;
    children: string;
    mode: string;
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

    protected getDetails()
    {
        const app = Application.instance;
        const details: Record<string, ModelDetail> = {};

        app.project.walk<ClonableNode>((node) =>
        {
            const model = node.model;

            const detail: ModelDetail = {
                $: model,
                owner: model.owner.id,
                parent: model.parent ? model.parent.id : '#empty#',
                children: model.children.length === 0 ? '#empty#' : model.children.map((model) => model.id).join(','),
                mode: shortCloneMode(model.cloneMode),
                values: model.ownValues,
            };

            details[model.id] = detail;
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
        const model = this.getCell('$', row).value as Model<any>;

        if (hasInstance(id))
        {
            const node = getInstance<ClonableNode>(id);

            if (node.isMetaNode)
            {
                cellStyle.fillColor = Color(cellStyle.fillColor).darken(0.05).hex();
            }

            if (app.selection.project.shallowContains(node.cast<MetaNode>()))
            {
                cellStyle.fillColor = Color('#2e66c8').hex();
                cellStyle.fontStyle = 'bold';
            }
        }

        app.selection.hierarchy.items.forEach((item) =>
        {
            if (item.model === model)
            {
                cellStyle.fillColor = Color('#2eb2c8').hex();
                cellStyle.fontStyle = 'bold';
                cellStyle.fontColor = 'white';
            }
        });
    };

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
