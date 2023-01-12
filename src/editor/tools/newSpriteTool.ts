import type { DisplayObjectNode } from '../../core/nodes/abstract/displayObjectNode';
import { getInstance } from '../../core/nodes/instances';
import { nextTick } from '../../core/util';
import { Actions } from '../actions';
import { getApp } from '../core/application';
import { type ToolEvent, Tool } from '../core/tool';
import { ScaleByEdgeOperation } from '../ui/transform/operations/scaleByEdge';
import { defaultSelectTransformGizmoConfig } from '../ui/transform/types';
import { Icons } from '../ui/views/icons';
import { Tools } from './tools';

export class NewSpriteTool extends Tool
{
    protected hasCreatedSprite: boolean;

    constructor()
    {
        super('newSprite', { icon: Icons.Sprite, tip: 'New Sprite' });
        this.hasCreatedSprite = false;
    }

    public select()
    {
        const app = getApp();
        const gizmo = app.view.gizmo;

        gizmo.setConfig({
            ...defaultSelectTransformGizmoConfig,
            enableScaling: true,
            updateMode: 'graphOnly',
        });

        gizmo.isInteractive = false;

        this.hasCreatedSprite = false;
    }

    public mouseDown(event: ToolEvent): void
    {
        const app = getApp();
        const selection = app.selection.hierarchy;
        const parentId = selection.hasSelection ? selection.lastItem.id : app.view.rootNode.id;
        const parent = getInstance<DisplayObjectNode>(parentId);
        const localPos = parent.globalToLocal(event.globalX, event.globalY);

        const sprite = Actions.newSprite.dispatch({
            parentId,
            model: {
                x: localPos.x,
                y: localPos.y,
                scaleX: 0.1,
                scaleY: 0.1,
            },
        });

        if (sprite)
        {
            const viewport = app.view;

            const gizmo = viewport.gizmo;

            gizmo.isInteractive = true;
            gizmo.setActiveVertex({ h: 'right', v: 'bottom' });
            gizmo.startOperation(event.originalEvent, new ScaleByEdgeOperation(gizmo));

            this.hasCreatedSprite = true;
        }
    }

    public mouseUp(): void
    {
        const app = getApp();

        if (app.isAreaFocussed('viewport') && this.hasCreatedSprite)
        {
            nextTick().then(() =>
            {
                app.setTool(Tools.select);
            });
        }
    }
}
