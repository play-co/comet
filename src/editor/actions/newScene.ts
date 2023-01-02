import { FolderNode } from '../../core/nodes/concrete/meta/folderNode';
import type { SceneNode } from '../../core/nodes/concrete/meta/sceneNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type CreateNodeCommandReturn, CreateNodeCommand } from '../commands/createNode';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export class NewSceneAction extends Action<void, SceneNode>
{
    constructor()
    {
        super('newScene');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('project');
    }

    protected exec(): SceneNode
    {
        const app = Application.instance;
        const selection = app.selection.project;
        let parentId = app.project.getRootFolder('Scenes').id;

        if (selection.hasSelection && selection.firstItem.is(FolderNode) && selection.firstItem.cast<FolderNode>().isWithinRootFolder('Scenes'))
        {
            parentId = selection.firstItem.cast<FolderNode>().id;
        }

        const nodeSchema = createNodeSchema('Scene', {
            parent: parentId,
        });

        const { node } = app.undoStack.exec<CreateNodeCommandReturn>(new CreateNodeCommand({ nodeSchema }));

        const scene = node.cast<SceneNode>();

        app.edit(scene);

        return scene;
    }
}
