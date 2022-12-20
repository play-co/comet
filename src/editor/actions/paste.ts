import { Action } from '../core/action';
import { getApp } from '../core/application';

export class PasteAction extends Action<void, void>
{
    constructor()
    {
        super('paste', {
            hotkey: 'Ctrl+V',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport');
    }

    protected exec()
    {
        // invoke clone command
    }
}
