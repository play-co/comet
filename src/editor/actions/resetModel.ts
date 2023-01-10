import { ResetModelCommand } from '../commands/resetModel';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export class ResetModelAction extends Action<void, void>
{
    constructor()
    {
        super('resetModel');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'hierarchy');
    }

    protected exec()
    {
        const app = getApp();
        const selection = app.selection.hierarchy;

        app.undoStack.exec(new ResetModelCommand({
            nodeIds: selection.items.map((node) => node.id),
        }));
    }
}
