import { Actions } from '../actions';
import { SetParentCommand } from '../commands/setParent';
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
        const gizmo = app.viewport.gizmo;

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
        const parentId = selection.hasSelection ? selection.lastItem.id : app.viewport.rootNode.id;

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
            const viewport = app.viewport;

            const gizmo = viewport.gizmo;

            new SetParentCommand({
                nodeId: sprite.id,
                parentId,
                updateMode: 'full',
                preserveTransform: false,
            }).run();

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
            app.setTool(Tools.select);
        }
    }
}
