import type { ClonableNode } from '../../core';
import { type CreatePrefabVariantCommandReturn, CreatePrefabVariantCommand } from '../commands/createPrefabVariant';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type CreatePrefabVariantOptions = {
    nodeId: string;
};

export class CreatePrefabVariantAction extends Action<CreatePrefabVariantOptions, ClonableNode>
{
    constructor()
    {
        super('createPrefabVariant');
    }

    public shouldRun(): boolean
    {
        const app = getApp();
        const selection = app.selection.project;
        const prefabFolder = app.project.getRootFolder('Prefabs');

        return super.shouldRun()
         && selection.hasSelection
          && prefabFolder.contains(selection.firstItem);
    }

    protected exec(options: CreatePrefabVariantOptions): ClonableNode
    {
        const app = Application.instance;

        const { node } = app.undoStack.exec<CreatePrefabVariantCommandReturn>(new CreatePrefabVariantCommand({ nodeId: options.nodeId }));

        app.selection.project.set(node.asClonableNode());

        return node;
    }
}
