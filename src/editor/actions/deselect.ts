import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export class DeselectAction extends Action<void, void>
{
    constructor()
    {
        super('deselect', {
            hotkey: 'Ctrl+Shift+A',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport');
    }

    protected exec()
    {
        const app = Application.instance;

        app.selection.hierarchy.deselect();
    }
}
