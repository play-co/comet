import { RemoveNodesCommand } from '../commands/removeNodes';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type DeleteNodeOptions = {
    nodeId?: string;
};

export class DeleteNodeAction extends Action<DeleteNodeOptions, void>
{
    constructor()
    {
        super('deleteNode', {
            hotkey: 'backspace,delete,del',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'project', 'hierarchy');
    }

    protected exec(options: DeleteNodeOptions): void
    {
        const app = Application.instance;
        const nodeIds: string[] = [];

        if (options.nodeId)
        {
            nodeIds.push(options.nodeId);
        }
        else
        {
            nodeIds.push(...app.selection.hierarchy.items.map((node) => node.id));
        }

        if (nodeIds.length)
        {
            app.undoStack.exec(new RemoveNodesCommand({ nodeIds }));
        }
    }
}
