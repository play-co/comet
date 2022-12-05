import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObject';
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
        const nodes: Set<DisplayObjectNode> = new Set();
        const app = Application.instance;

        app.viewport.rootNode.walk<DisplayObjectNode>((node) =>
        {
            nodes.add(node);
        });

        app.selection.set([...nodes]);
    }
}
