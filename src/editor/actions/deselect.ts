import { Action } from '../core/action';
import { Application } from '../core/application';

export class DeselectAction extends Action<void, void>
{
    constructor()
    {
        super('deselect', {
            hotkey: 'Ctrl+Shift+A',
        });
    }

    protected exec()
    {
        const app = Application.instance;

        app.selection.hierarchy.deselect();
    }
}
