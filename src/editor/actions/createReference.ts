import { SceneNode } from '../../core/nodes/concrete/meta/sceneNode';
import { CreatePrefabAssetCommand } from '../commands/createPrefabAsset';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export class CreateReferenceAction extends Action<void, void>
{
    constructor()
    {
        super('createReference');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();
        const selection = app.selection.hierarchy;
        const isOnlySceneSelected = selection.isSingle && selection.firstNode.is(SceneNode);
        const isViewportFocussed = app.isAreaFocussed('viewport', 'hierarchy');

        return super.shouldRun()
            && isViewportFocussed
            && !isOnlySceneSelected
            && selection.isSingle;
    }

    protected exec()
    {
        const app = getApp();
        const selection = app.selection.hierarchy;

        app.undoStack.exec(new CreatePrefabAssetCommand({ nodeId: selection.firstNode.id }));
    }
}
