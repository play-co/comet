import Color from 'color';

import type { ClonableNode } from '../../../core';
import type { GraphNode } from '../../../core/nodes/abstract/graphNode';
import type { MetaNode } from '../../../core/nodes/abstract/metaNode';
import { getInstance, hasInstance } from '../../../core/nodes/instances';
import { Application, getApp } from '../../core/application';
import { DevInspector } from '../devInspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from '../tableRenderer';

export interface CloneInfo
{
    root: string;
    original: string;
    addMode: string;
    addTarget: string;
    removeTarget: string;
    cloneTarget: string;
    cloneDesc: string;
    cloneAnc: string;
    cloneTreeAnc: string;
    dependants: string;
    dependencies: string;
    restoreDeps: string;
}

export interface CloneDetail extends Omit<CloneInfo, 'cloneTreeAnc' | 'dependants' | 'dependencies' | 'restoreDeps'>
{
    $: ClonableNode;
    _isCloaked: boolean;
    root: string;
    original: string;
    addMode: string;
    addTarget: string;
    removeTarget: string;
    cloneTarget: string;
    cloneDesc: string;
    cloneAnc: string;
}

const ids = (nodes: GraphNode[]) =>
{
    if (nodes.length === 0)
    {
        return '#empty#';
    }

    return nodes.map((node) => node.id).join(', ');
};

export class CloneInspector extends DevInspector<CloneDetail>
{
    protected init(): void
    {
        setInterval(() =>
        {
            this.render();
        }, 500);
    }

    protected getCloneInfo(node: ClonableNode): CloneInfo
    {
        return {
            root: node.getRootNode().id,
            original: node.getOriginal().id,
            addMode: node.getAddChildCloneMode().toString(),
            addTarget: node.getAddChildCloneTarget().id,
            removeTarget: node.getRemoveChildTarget().id,
            cloneTarget: node.getCloneTarget().id,
            cloneAnc: ids(node.getCloneAncestors()),
            cloneDesc: ids(node.getClonedDescendants()),
            cloneTreeAnc: ids(node.getCloneTreeAncestors()),
            dependants: ids(node.getDependants()),
            dependencies: ids(node.getDependencies()),
            restoreDeps: ids(node.getRestoreDependencies()),
        };
    }

    protected getDetails()
    {
        const app = Application.instance;
        const details: Record<string, CloneDetail> = {};

        app.project.walk<ClonableNode>((node) =>
        {
            const cloneInfo = this.getCloneInfo(node) as any;

            delete cloneInfo.cloneTreeAnc;
            delete cloneInfo.dependants;
            delete cloneInfo.dependencies;
            delete cloneInfo.restoreDeps;

            const detail: CloneDetail = {
                $: node,
                _isCloaked: node.isCloaked,
                ...cloneInfo,
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
        const cloakedCell = this.getCell('_isCloaked', row);

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
        const value = this.getRowValue(row);

        if (value)
        {
            console.log(this.getCloneInfo(value));
        }

        if (value && app.viewport.rootNode.contains(value))
        {
            app.selection.hierarchy.set(value);
        }
        else
        {
            app.selection.project.set(value);
        }
    }
}
