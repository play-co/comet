import type { ClonableNode } from '../../core';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export class SelectAllAction extends Action
{
    constructor()
    {
        super('select-all', {
            hotkey: 'Ctrl+A',
        });
    }

    public shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'hierarchy');
    }

    protected exec()
    {
        const app = Application.instance;

        const nodes = app.viewport.rootNode.walk<ClonableNode, {nodes: Set<ClonableNode>}>((node, options) =>
        {
            if (node.isCloaked)
            {
                options.cancel = true;

                return;
            }

            options.data.nodes.add(node);
        }, {
            includeSelf: false,
            data: {
                nodes: new Set(),
            },
        }).nodes;

        app.selection.hierarchy.set([...nodes]);
    }
}
