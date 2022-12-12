import type { ContainerModel } from '../../core/nodes/concrete/display/containerNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';
import { Action } from '../core/action';
import { Application } from '../core/application';
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

    protected exec(options: NewContainerOptions = {
        model: {},
        addToSelected: true,
    }): EmptyNode
    {
        const app = Application.instance;
        const selectedNode = app.selection.lastNode;

        let parentId = 'Scene:1';

        if (selectedNode && options.addToSelected)
        {
            parentId = selectedNode.id;
        }

        const nodeSchema = createNodeSchema('Empty', {
            parent: parentId,
            model: {
                x: 50,
                y: 50,
                tint: Math.round(Math.random() * 100000),
                ...options.model,
            },
        });

        const { nodes } = app.undoStack.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as EmptyNode;

        app.selection.set(node.asClonableNode());

        return node;
    }
}
