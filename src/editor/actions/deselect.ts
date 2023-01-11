import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export class DeselectAction extends Action
{
    constructor()
    {
        super('deselect', {
            hotkey: 'Ctrl+Shift+A',
        });
    }

    public shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'hierarchy');
    }

    protected exec()
    {
        const app = Application.instance;

        app.selection.hierarchy.deselect();
    }
}
