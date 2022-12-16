import type { ContainerModel } from '../../core/nodes/concrete/display/containerNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';
import type { EmptyNode } from '../nodes/empty';

export type NewContainerOptions = {
    addToSelected?: boolean;
    model?: Partial<ContainerModel>;
};

export class NewContainerAction extends Action<NewContainerOptions, EmptyNode>
{
    constructor()
    {
        super('newContainer', {
            hotkey: 'Shift+Ctrl+N',
        });
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'hierarchy');
    }

    protected exec(options: NewContainerOptions = {
        model: {},
        addToSelected: true,
    }): EmptyNode
    {
        const app = Application.instance;
        const { selection: { hierarchy: selection } } = app;

        let parentId = app.viewport.rootNode.id;

        if (options.addToSelected && selection.hasSelection)
        {
            parentId = selection.lastNode.id;
        }

        const nodeSchema = createNodeSchema('Empty', {
            parent: parentId,
            model: {
                x: 10,
                y: 10,
                tint: Math.round(Math.random() * 100000),
                ...options.model,
            },
        });

        const { nodes } = app.undoStack.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as EmptyNode;

        app.selection.hierarchy.set(node.asClonableNode());

        return node;
    }
}
