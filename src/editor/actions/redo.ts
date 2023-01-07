import { Action } from '../core/action';
import { Application } from '../core/application';
import { writeCommandList } from '../core/history';

export class RedoAction extends Action<void, void>
{
    constructor()
    {
        super('redo', {
            hotkey: 'Ctrl+Shift+Z',
        });
    }

    protected shouldRun(): boolean
    {
        return Application.instance.undoStack.canRedo;
    }

    protected exec()
    {
        writeCommandList('redo');
        Application.instance.undoStack.redo();
    }
}
