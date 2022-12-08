import type { ClonableNode } from '../../core';
import { Action } from '../core/action';
import { Application } from '../core/application';

export class SelectAllAction extends Action<void, void>
{
    constructor()
    {
        super('select-all', {
            hotkey: 'Ctrl+A',
        });
    }

    protected exec()
    {
        const nodes: Set<ClonableNode> = new Set();
        const app = Application.instance;

        app.viewport.rootNode.walk<ClonableNode>((node) =>
        {
            nodes.add(node);
        });

        app.selection.set([...nodes]);
    }
}
