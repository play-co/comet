import type { ContainerModel, ContainerNode } from '../../core/nodes/concrete/display/containerNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type NewContainerOptions = {
    addToSelected?: boolean;
    model?: Partial<ContainerModel>;
};

export class NewContainerAction extends Action<NewContainerOptions, ContainerNode>
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
    }): ContainerNode
    {
        const app = Application.instance;
        const { selection: { hierarchy: selection } } = app;

        let parentId = app.viewport.rootNode.id;

        if (options.addToSelected && selection.hasSelection)
        {
            parentId = selection.lastItem.id;
        }

        const nodeSchema = createNodeSchema('Container', {
            parent: parentId,
            model: {
                x: 10,
                y: 10,
                tint: Math.round(Math.random() * 100000),
                ...options.model,
            },
        });

        const { nodes } = app.undoStack.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as ContainerNode;

        app.selection.hierarchy.set(node.asClonableNode());

        return node;
    }
}
