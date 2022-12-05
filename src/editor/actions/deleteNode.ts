import { RemoveNodesCommand } from '../commands/removeNodes';
import { Action } from '../core/action';
import { Application } from '../core/application';

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
            nodeIds.push(...app.selection.nodes.map((node) => node.id));
        }

        app.undoStack.exec(new RemoveNodesCommand({ nodeIds }));
    }
}
