import { Action } from '../core/action';
import { getApp  } from '../core/application';

export class ZoomOutAction extends Action
{
    constructor()
    {
        super('zoomOut', {
            hotkey: 'Ctrl+-',
        });
    }

    protected exec()
    {
        getApp().view.zoomOut();
    }
}
