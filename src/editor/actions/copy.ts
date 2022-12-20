import { Action } from '../core/action';
import { getApp } from '../core/application';

export class CopyAction extends Action<void, void>
{
    constructor()
    {
        super('copy', {
            hotkey: 'Ctrl+C',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport');
    }

    protected exec()
    {
        const app = getApp();
        const selection = app.selection.hierarchy;

        if (selection.hasSelection)
        {
            app.setClipboard(selection.firstNode);
        }
    }
}
