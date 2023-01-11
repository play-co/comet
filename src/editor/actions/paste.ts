import { SceneNode } from '../../core/nodes/concrete/meta/sceneNode';
import { PasteCommand } from '../commands/paste';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export class PasteAction extends Action
{
    constructor()
    {
        super('paste', {
            hotkey: 'Ctrl+V',
        });
    }

    public shouldRun(): boolean
    {
        const app = getApp();
        const selection = app.selection.hierarchy;
        const isOnlySceneSelected = selection.isSingle && selection.firstItem.is(SceneNode);

        return super.shouldRun()
            && app.hasClipboard()
            && selection.isSingle
            && app.isAreaFocussed('viewport', 'hierarchy')
            && !isOnlySceneSelected;
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
