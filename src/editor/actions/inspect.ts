import { Action } from '../core/action';

export class InspectAction extends Action<void, void>
{
    constructor()
    {
        super('inspect', {
            hotkey: 'Ctrl+I',
        });
    }

    protected exec()
    {
        (window as any).inspect.all();
    }
}
