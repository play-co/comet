import { Action } from '../core/action';
import { getApp  } from '../core/application';

export class ZoomInAction extends Action
{
    constructor()
    {
        super('zoomIn', {
            hotkey: 'Ctrl+=',
        });
    }

    protected exec()
    {
        getApp().view.zoomIn();
    }
}
