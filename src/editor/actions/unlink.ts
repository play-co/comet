import { UnlinkCommand } from '../commands/unlink';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export class UnlinkAction extends Action
{
    constructor()
    {
        super('unlink');
    }

    public shouldRun(): boolean
    {
        const app = getApp();
        const selection = app.selection.hierarchy;

        return super.shouldRun()
            && app.isAreaFocussed('viewport', 'hierarchy')
            && selection.isSingle
            && selection.firstItem.cloneInfo.isRoot;
    }

    protected exec()
    {
        const app = getApp();
        const selection = app.selection.hierarchy;

        app.undoStack.exec(new UnlinkCommand({
            nodeId: selection.firstItem.id,
        }));
    }
}
