import { Action } from '../core/action';
import { Application } from '../core/application';
import { writeCommandList } from '../core/history';

export class UndoAction extends Action
{
    constructor()
    {
        super('undo', {
            hotkey: 'Ctrl+Z',
        });
    }

    public shouldRun(): boolean
    {
        return Application.instance.undoStack.canUndo;
    }

    protected exec()
    {
        writeCommandList('undo');
        Application.instance.undoStack.undo();
    }
}
