import type { SceneNode } from '../../core/nodes/concrete/meta/sceneNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type CreateNodeCommandReturn, CreateNodeCommand } from '../commands/createNode';
import { Action } from '../core/action';
import { Application } from '../core/application';

export class NewSceneAction extends Action<void, SceneNode>
{
    constructor()
    {
        super('newScene');
    }

    protected exec(): SceneNode
    {
        const app = Application.instance;

        const nodeSchema = createNodeSchema('Scene', {
            parent: app.project.getRootFolder('Scenes').id,
        });

        const { node } = app.undoStack.exec<CreateNodeCommandReturn>(new CreateNodeCommand({ nodeSchema }));

        const scene = node.cast<SceneNode>();

        app.edit(scene);

        return scene;
    }
}
