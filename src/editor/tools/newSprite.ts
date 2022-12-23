import { Actions } from '../actions';
import { getApp } from '../core/application';
import { type ToolEvent, Tool } from '../core/tool';
import { ScaleByEdgeOperation } from '../ui/transform/operations/scaleByEdge';
import { Icons } from '../ui/views/icons';
import { Tools } from './tools';

export class NewSpriteTool extends Tool
{
    constructor()
    {
        super('newSprite', { icon: Icons.Sprite, tip: 'New Sprite' });
    }

    public mouseDown(event: ToolEvent): void
    {
        const sprite = Actions.newSprite.dispatch({
            addToSelected: false,
            model: {
                x: event.localX,
                y: event.localY,
                scaleX: 0.1,
                scaleY: 0.1,
            },
        });

        if (sprite)
        {
            const app = getApp();
            const viewport = app.viewport;
            const gizmo = viewport.gizmo;

            gizmo.setActiveVertex({ h: 'right', v: 'bottom' });
            gizmo.startOperation(event.originalEvent, new ScaleByEdgeOperation(gizmo));
        }
    }

    public mouseUp(): void
    {
        const app = getApp();

        app.setTool(Tools.select);
    }
}
