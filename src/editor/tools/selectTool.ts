import { getApp } from '../core/application';
import { type ToolEvent, Tool } from '../core/tool';
import { Icons } from '../ui/views/icons';

export class SelectTool extends Tool
{
    constructor()
    {
        super('select', { icon: Icons.Select, tip: 'Select' });
    }

    public deselect(): void
    {
        getApp().selection.hierarchy.deselect();
    }

    public mouseDown(event: ToolEvent): void
    {
        const app = getApp();
        const viewport = app.viewport;
        const { originalEvent, globalX, globalY, shift, meta } = event;

        const { hierarchy: selection } = app.selection;
        const underCursor = viewport.findNodesAtPoint(globalX, globalY).filter((node) => !selection.deepContains(node));
        const topNode = underCursor[0];
        const isShiftKeyPressed = shift;
        const isMetaKeyPressed = meta;
        const isAddKey = isShiftKeyPressed || isMetaKeyPressed;
        const gizmoFrameBounds = viewport.gizmo.frame.getGlobalBounds();

        if (gizmoFrameBounds.contains(globalX, globalY) && isAddKey)
        {
            // click inside transform gizmo area remove from selection if shift down
            const nodes = viewport.findNodesAtPoint(globalX, globalY);
            const underCursor = nodes.filter((node) => selection.deepContains(node));
            const topNode = underCursor[0];

            selection.remove(topNode);
        }

        // click outside of transform gizmo area
        if (underCursor.length === 0)
        {
            // nothing selected, deselect
            selection.deselect();

            viewport.boxSelection.onMouseDown(originalEvent);
        }
        else
        {
            const selectedNode = topNode.getCloneRoot();

            if (isAddKey)
            {
                // add new node to selection
                selection.add(topNode);
            }
            else
            {
                // new selection and start dragging
                viewport.selectWithDrag(selectedNode, originalEvent);
            }
        }
    }

    public mouseMove(event: ToolEvent)
    {
        const app = getApp();
        const viewport = app.viewport;

        viewport.boxSelection.onMouseMove(event.originalEvent);
    }
}
