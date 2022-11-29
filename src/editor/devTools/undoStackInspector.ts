import { Application } from '../core/application';
import { DevInspector } from './inspector';

interface UndoStackDetail
{
    name: string;
}

export class UndoStackInspector extends DevInspector<UndoStackDetail>
{
    protected getDetails()
    {
        const undoStack = Application.instance.undoStack;
        const details: UndoStackDetail[] = [];

        undoStack.stack.forEach((command) =>
        {
            const detail: UndoStackDetail = {
                name: command.name,
            };

            details.push(detail);
        });

        return details;
    }

    protected inspect()
    {
        const undoStack = Application.instance.undoStack;

        console.log(undoStack.stack);
    }
}
