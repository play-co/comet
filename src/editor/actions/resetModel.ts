import { ResetModelCommand } from '../commands/resetModel';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export class ResetModelAction extends Action
{
    constructor()
    {
        super('resetModel');
    }

    public shouldRun(): boolean
    {
        const app = getApp();
        const selection = app.selection.hierarchy;

        return super.shouldRun()
            && app.isAreaFocussed('viewport', 'hierarchy')
            && selection.hasSelection;
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
