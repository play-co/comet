import { Action } from '../core/action';
import { getApp  } from '../core/application';

export class ResetViewAction extends Action
{
    constructor()
    {
        super('resetView', {
            hotkey: 'Ctrl+0',
        });
    }

    protected exec()
    {
        getApp().view.resetView();
    }
}
