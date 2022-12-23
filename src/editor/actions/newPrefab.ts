import type { ClonableNode } from '../../core';
import type { ModelBase } from '../../core/model/model';
import { type CreatePrefabInstanceCommandReturn, CreatePrefabInstanceCommand } from '../commands/createPrefabInstance';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type NewPrefabOptions = {
    clonerId: string;
    parentId?: string;
    model?: Partial<ModelBase>;
};

export class NewPrefabAction extends Action<NewPrefabOptions, ClonableNode>
{
    constructor()
    {
        super('NewPrefab');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport');
    }

    protected exec(options: NewPrefabOptions): ClonableNode
    {
        const app = Application.instance;

        const parentId = options.parentId ?? app.viewport.rootNode.id;

        const { node } = app.undoStack.exec<CreatePrefabInstanceCommandReturn>(new CreatePrefabInstanceCommand({
            parentId,
            clonerId: options.clonerId,
            model: options.model,
        }));

        return node;
    }
}
