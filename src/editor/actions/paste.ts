import { PasteCommand } from '../commands/paste';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export class PasteAction extends Action<void, void>
{
    constructor()
    {
        super('paste', {
            hotkey: 'Ctrl+V',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'hierarchy');
    }

    protected exec()
    {
        const app = getApp();
        const clipboard = app.getClipboard();

        app.undoStack.exec(new PasteCommand({
            nodeIds: clipboard.map((node) => node.id),
        }));
    }
}
