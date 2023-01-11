import { Action } from '../core/action';
import { Application } from '../core/application';
import { writeCommandList } from '../core/history';

export class RedoAction extends Action
{
    constructor()
    {
        super('redo', {
            hotkey: 'Ctrl+Shift+Z',
        });
    }

    public shouldRun(): boolean
    {
        return Application.instance.undoStack.canRedo;
    }

    protected exec()
    {
        writeCommandList('redo');
        Application.instance.undoStack.redo();
    }
}
