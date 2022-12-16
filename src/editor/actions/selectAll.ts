import type { ClonableNode } from '../../core';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export class SelectAllAction extends Action<void, void>
{
    constructor()
    {
        super('select-all', {
            hotkey: 'Ctrl+A',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport');
    }

    protected exec()
    {
        const nodes: Set<ClonableNode> = new Set();
        const app = Application.instance;

        app.viewport.rootNode.walk<ClonableNode>((node) =>
        {
            nodes.add(node);
        });

        app.selection.hierarchy.set([...nodes]);
    }
}
