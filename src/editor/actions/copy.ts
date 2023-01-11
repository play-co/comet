import { SceneNode } from '../../core/nodes/concrete/meta/sceneNode';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export class CopyAction extends Action
{
    constructor()
    {
        super('copy', {
            hotkey: 'Ctrl+C',
        });
    }

    public shouldRun(): boolean
    {
        const app = getApp();
        const selection = app.selection.hierarchy;
        const isOnlySceneSelected = selection.length === 1 && selection.firstItem.is(SceneNode);

        return super.shouldRun()
            && app.isAreaFocussed('viewport', 'hierarchy')
            && selection.hasSelection
            && !isOnlySceneSelected;
    }

    protected exec()
    {
        const app = getApp();
        const selection = app.selection.hierarchy;

        if (selection.hasSelection)
        {
            const reducedSelection = selection.findUnique().filter((node) => !node.is(SceneNode));

            app.setClipboard(reducedSelection);

            app.statusBar.setMessage(`Copied ${selection.length} node${selection.length > 1 ? 's' : ''} to clipboard`);
        }
    }
}
