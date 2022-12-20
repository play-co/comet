import { CloneMode } from '../../core/nodes/cloneInfo';
import { type CloneCommandReturn, CloneCommand } from '../commands/clone';
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
        const selection = app.selection.hierarchy;
        const clipboard = app.getClipboard();

        if (clipboard.length === 1)
        {
            const sourceNode = clipboard[0];
            let newParentId = selection.length === 1
                ? selection.firstNode.id
                : sourceNode.getMetaNode().id;

            if (app.selection.hierarchy.length === 1)
            {
                newParentId = app.selection.hierarchy.firstNode.id;
            }

            // for multiple node selections, clone each one and paste into single selected parent

            const { clonedNode } = app.undoStack.exec<CloneCommandReturn>(new CloneCommand({
                nodeId: sourceNode.id,
                cloneMode: CloneMode.Duplicate,
                newParentId,
            }));

            selection.set(clonedNode);
        }
    }
}
