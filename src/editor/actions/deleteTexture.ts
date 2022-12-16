import { RemoveNodesCommand } from '../commands/removeNodes';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export type DeleteTextureOptions = {
    nodeId: string;
};

export class DeleteTextureAction extends Action<DeleteTextureOptions, void>
{
    constructor()
    {
        super('DeleteTexture');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('project');
    }

    protected exec(options: DeleteTextureOptions): void
    {
        const { nodeId } = options;
        const app = getApp();

        app.undoStack.exec(new RemoveNodesCommand({ nodeIds: [nodeId] }));
    }
}
