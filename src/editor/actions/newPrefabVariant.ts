import type { ClonableNode } from '../../core';
import { type CreatePrefabVariantCommandReturn, CreatePrefabVariantCommand } from '../commands/createPrefabVariant';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type NewPrefabVariantOptions = {
    nodeId: string;
};

export class NewPrefabVariantAction extends Action<NewPrefabVariantOptions, ClonableNode>
{
    constructor()
    {
        super('NewPrefabVariant');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('project');
    }

    protected exec(options: NewPrefabVariantOptions): ClonableNode
    {
        const app = Application.instance;

        const { node } = app.undoStack.exec<CreatePrefabVariantCommandReturn>(new CreatePrefabVariantCommand({ nodeId: options.nodeId }));

        app.selection.project.set(node.asClonableNode());

        return node;
    }
}
