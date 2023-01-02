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
        Actions.newContainer.dispatch({
            addToSelected: false,
            model: {
                x: event.localX,
                y: event.localY,
            },
        });
    }

    public mouseUp(): void
    {
        const app = getApp();

        app.setTool(Tools.select);
    }
}
