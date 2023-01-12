import type { ContainerModel, ContainerNode } from '../../core/nodes/concrete/display/containerNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type CreateChildCommandReturn, CreateChildCommand } from '../commands/createChild';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type NewContainerOptions = {
    parentId?: string;
    model?: Partial<ContainerModel>;
};

export const defaultNewContainerOptions: NewContainerOptions = {
    model: {},
};

export class NewContainerAction extends Action<NewContainerOptions, ContainerNode>
{
    constructor()
    {
        super('newContainer', {
            hotkey: 'Shift+Ctrl+N',
        });
    }

    public shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'hierarchy');
    }

    protected exec(options: NewContainerOptions = {
        model: {},
    }): ContainerNode
    {
        const actionOptions = {
            ...defaultNewContainerOptions,
            ...options,
        };
        const app = Application.instance;
        const { selection: { hierarchy: selection } } = app;

        const parentId = actionOptions.parentId ?? (selection.hasSelection ? selection.lastItem.id : app.viewport.rootNode.id);

        const nodeSchema = createNodeSchema('Container', {
            parent: parentId,
            model: {
                x: 10,
                y: 10,
                ...options.model,
            },
        });

        const { nodes } = app.undoStack.exec<CreateChildCommandReturn>(new CreateChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as ContainerNode;

        app.selection.hierarchy.set(node.asClonableNode());

        return node;
    }
}
