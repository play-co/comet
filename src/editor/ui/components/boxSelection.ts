import Color from 'color';
import { type InteractionEvent, Graphics, Point, Rectangle } from 'pixi.js';

import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';

export class BoxSelection extends Graphics
{
    public isSelecting: boolean;
    public origin?: Point;
    public corner?: Point;

    constructor()
    {
        super();
        this.isSelecting = false;
    }

    public onMouseDown(e: InteractionEvent)
    {
        const x = e.data.global.x;
        const y = e.data.global.y;

        this.isSelecting = true;
        this.origin = new Point(x, y);
        this.corner = new Point(x, y);

        document.body.classList.add('no_splitter_hover');
    }

    public onMouseMove(e: InteractionEvent)
    {
        if (this.isSelecting)
        {
            const x = e.data.global.x;
            const y = e.data.global.y;

            this.corner = new Point(x, y);
            this.draw();
        }
    }

    public onMouseUp()
    {
        if (this.isSelecting)
        {
            this.isSelecting = false;
            this.clear();

            document.body.classList.remove('no_splitter_hover');
        }
    }

    get selectionBounds()
    {
        const { origin, corner } = this;

        if (origin && corner)
        {
            const minX = Math.min(origin.x, corner.x);
            const minY = Math.min(origin.y, corner.y);
            const maxX = Math.max(origin.x, corner.x);
            const maxY = Math.max(origin.y, corner.y);

            return new Rectangle(minX, minY, maxX - minX, maxY - minY);
        }

        return Rectangle.EMPTY;
    }

    protected draw()
    {
        const { selectionBounds } = this;

        this.clear();

        this.beginFill(Color('cyan').rgbNumber(), 0.25);
        this.drawRect(selectionBounds.left, selectionBounds.top, selectionBounds.width, selectionBounds.height);
        this.endFill();

        this.lineStyle(1, Color('cyan').rgbNumber(), 1);
        this.drawRect(selectionBounds.left, selectionBounds.top, selectionBounds.width, selectionBounds.height);
    }

    public selectWithinRootNode(rootNode: DisplayObjectNode)
    {
        const { selectionBounds } = this;

        const allNodes: DisplayObjectNode[] = [];
        const selected: Set<DisplayObjectNode> = new Set();

        // get all nodes (will return node children)
        rootNode.walk<DisplayObjectNode>((node) =>
        {
            if (node.isMetaNode || node.isCloaked)
            {
                return;
            }

            const bounds = node.getGlobalBounds(false);

            if (bounds.intersects(selectionBounds))
            {
                allNodes.push(node);
            }
        });

        // filter down to top level clone root
        allNodes.forEach((node) =>
        {
            selected.add(node);
        });

        return [...selected];
    }
}
