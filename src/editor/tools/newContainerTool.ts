import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObjectNode';
import { getInstance } from '../../core/nodes/instances';
import { Actions } from '../actions';
import { getApp } from '../core/application';
import { type ToolEvent, Tool } from '../core/tool';
import { Icons } from '../ui/views/icons';
import { Tools } from './tools';

export class NewContainerTool extends Tool
{
    constructor()
    {
        super('newContainer', { icon: Icons.Container, tip: 'New Container' });
    }

    public mouseDown(event: ToolEvent): void
    {
        const app = getApp();
        const selection = app.selection.hierarchy;
        const parentId = selection.hasSelection ? selection.lastItem.id : app.view.rootNode.id;
        const parent = getInstance<DisplayObjectNode>(parentId);
        const localPos = parent.globalToLocal(event.globalX, event.globalY);

        Actions.newContainer.dispatch({
            parentId,
            model: {
                x: localPos.x,
                y: localPos.y,
            },
        });
    }

    public mouseUp(): void
    {
        const app = getApp();

        app.setTool(Tools.select);
    }
}
