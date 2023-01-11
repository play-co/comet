import { RemovePrefabAssetCommand } from '../commands/removePrefabAsset';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export type DeletePrefabOptions = {
    nodeId: string;
};

export class DeletePrefabAction extends Action<DeletePrefabOptions>
{
    constructor()
    {
        super('deletePrefab');
    }

    public shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('project');
    }

    protected exec(options: DeletePrefabOptions): void
    {
        const { nodeId } = options;
        const app = getApp();

        app.undoStack.exec(new RemovePrefabAssetCommand({ nodeIds: [nodeId] }));
    }
}
