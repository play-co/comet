import { createNodeSchema } from '../../core/nodes/schema';
import { Application } from '../application';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';
import { Action } from '../core/action';
import type { EmptyNode } from '../nodes/empty';

export class NewContainerAction extends Action<EmptyNode>
{
    constructor()
    {
        super('newContainer', {
            hotkey: 'Shift+Ctrl+N',
        });
    }

    protected exec()
    {
        const app = Application.instance;
        const selectedNode = app.editorView.selection.lastNode;

        let parentId = 'Scene:1';

        if (selectedNode)
        {
            parentId = selectedNode.id;
        }

        const nodeSchema = createNodeSchema('Empty', {
            parent: parentId,
            model: {
                x: 50,
                y: 50,
                tint: Math.round(Math.random() * 100000),
            },
        });

        const { nodes } = app.undoStack.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as EmptyNode;

        app.editorView.selection.set(node);

        return node;
    }
}
