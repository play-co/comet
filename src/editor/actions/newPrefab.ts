import type { ClonableNode } from '../../core';
import type { SpriteModel } from '../../core/nodes/concrete/display/spriteNode';
import { type CloneInfoSchema, createNodeSchema } from '../../core/nodes/schema';
import { type CreatePrefabInstanceCommandReturn, CreatePrefabInstanceCommand } from '../commands/createPrefabInstance';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type NewPrefabOptions = {
    parentId?: string;
    model?: Partial<SpriteModel>;
    cloneInfo?: CloneInfoSchema;
};

export const defaultNewPrefabOptions: NewPrefabOptions = {
    model: {},
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

    protected exec(options?: Partial<NewPrefabOptions>): ClonableNode
    {
        const actionOptions = {
            ...defaultNewPrefabOptions,
            ...options,
        };
        const app = Application.instance;

        const parentId = actionOptions.parentId ?? app.viewport.rootNode.id;

        const nodeSchema = createNodeSchema('Sprite', {
            parent: parentId,
            cloneInfo: actionOptions.cloneInfo,
            model: actionOptions.model,
        });

        const { node } = app.undoStack.exec<CreatePrefabInstanceCommandReturn>(new CreatePrefabInstanceCommand({ parentId, nodeSchema }));

        app.selection.hierarchy.set(node.asClonableNode());

        return node;
    }
}
