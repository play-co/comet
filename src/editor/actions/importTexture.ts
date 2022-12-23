import { FolderNode } from '../../core/nodes/concrete/meta/folderNode';
import { type CreateTextureAssetCommandReturn, CreateTextureAssetCommand } from '../commands/createTextureAsset';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export type ImportTextureActionOptions = {
    files: FileList;
    createSpriteAtPoint?: {x: number; y: number};
};

export class ImportTextureAction extends Action<ImportTextureActionOptions, void>
{
    constructor()
    {
        super('importTexture');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'project');
    }

    protected exec(options: ImportTextureActionOptions)
    {
        const app = getApp();
        const { files, createSpriteAtPoint } = options;
        const { project: selection } = app.selection;
        const file = files[0];

        let folderParentId: string | undefined;

        if (selection.hasSelection
            && selection.firstNode.is(FolderNode)
            && selection.firstNode.cast<FolderNode>().isWithinRootFolder('Textures'))
        {
            folderParentId = selection.firstNode.id;
        }

        app.undoStack.exec<CreateTextureAssetCommandReturn>(
            new CreateTextureAssetCommand({
                folderParentId,
                file,
                createSpriteAtPoint,
            }),
        );
    }
}
