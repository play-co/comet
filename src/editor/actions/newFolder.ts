import type { FolderNode } from '../../core/nodes/concrete/meta/folderNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type CreateNodeCommandReturn, CreateNodeCommand } from '../commands/createNode';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export class NewFolderAction extends Action<void, FolderNode | null>
{
    constructor()
    {
        super('newFolder');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('project');
    }

    protected exec(): FolderNode | null
    {
        const app = Application.instance;
        const { selection: { project: selection } } = app;

        if (selection.hasSelection)
        {
            const selectedFolder = selection.firstItem.cast<FolderNode>();
            const nodeSchema = createNodeSchema('Folder', {
                parent: selectedFolder.id,
            });

            const { node } = app.undoStack.exec<CreateNodeCommandReturn>(new CreateNodeCommand({ nodeSchema }));

            const folder = node.cast<FolderNode>();

            selection.set(folder);

            return folder;
        }

        return null;
    }
}
