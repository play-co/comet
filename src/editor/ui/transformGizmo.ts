import type { InteractionEvent } from 'pixi.js';
import { Container, Graphics, Rectangle } from 'pixi.js';

import { angleBetween, distanceBetween, polarPoint } from '../../core/util/geom';
import { type DragInfo, drag, getWindowMouseClientPosition } from './drag';
import { isKeyPressed } from './keyboard';

// transform handle and origin sizes
const transformHandleSize = 7;
const halfTransformHandleSize = transformHandleSize * 0.5;
const originRadius = 7;

// transform handle template geometry
const handleTemplate = new Graphics();
const handleTemplateGeometry = handleTemplate.geometry;

handleTemplate.lineStyle(1, 0xffffff, 1);
handleTemplate.beginFill(0x000000);
handleTemplate.drawRect(0, 0, transformHandleSize, transformHandleSize);
handleTemplate.endFill();

export interface StartDragInfo
{
    handle: Graphics;
    bounds: Rectangle;
    angle: number;
    mouseAngle: number;
    centerDistance: number;
}

export class TransformGizmo extends Container
{
    public bounds: Rectangle;
    public border: Graphics;
    public topLeftHandle: Graphics;
    public topCenterHandle: Graphics;
    public topRightHandle: Graphics;
    public rightCenterHandle: Graphics;
    public bottomRightHandle: Graphics;
    public bottomCenterHandle: Graphics;
    public bottomLeftHandle: Graphics;
    public leftCenterHandle: Graphics;
    public origin: Graphics;
    public originPos: {
        x: number;
        y: number;
    };

    constructor()
    {
        super();

        const border = this.border = new Graphics();
        const origin = this.origin = new Graphics();

        this.bounds = new Rectangle(200, 200, 100, 50);

        // bind bounds drag events
        border.interactive = true;
        border.on('mousedown', this.onDragBounds);

        // bind origin drag events
        origin.interactive = true;
        origin.on('mousedown', this.onDragOrigin);

        this.angle = 45;

        // create origin
        this.originPos = { x: 0.5, y: 0.5 };
        origin.lineStyle(1, 0xffff00, 1);
        origin.beginFill(0x00ffff, 1);
        origin.drawCircle(0, 0, originRadius);
        origin.endFill();

        this.addChild(border);
        this.addChild(origin);

        // create handles
        this.topLeftHandle = this.createHandle(this.onDragRotation);
        this.topCenterHandle = this.createHandle(this.onDragVertical);
        this.topRightHandle = this.createHandle(this.onDragRotation);
        this.rightCenterHandle = this.createHandle(this.onDragHorizontal);
        this.bottomRightHandle = this.createHandle(this.onDragRotation);
        this.bottomCenterHandle = this.createHandle(this.onDragVertical);
        this.bottomLeftHandle = this.createHandle(this.onDragRotation);
        this.leftCenterHandle = this.createHandle(this.onDragHorizontal);

        this.update();
    }

    protected createHandle(dragHandler?: (startInfo: StartDragInfo, dragInfo: DragInfo, event: MouseEvent) => void)
    {
        const handle = new Graphics(handleTemplateGeometry);

        handle.interactive = true;
        handle.cursor = 'pointer';

        if (dragHandler)
        {
            handle.on('mousedown', () =>
            {
                const { bounds, angle } = this;

                const { x: centerX, y: centerY } = this.getBoundsCenter();
                const centerDistance = distanceBetween(centerX, centerY, handle.x, handle.y);

                const startInfo: StartDragInfo = {
                    handle,
                    bounds: bounds.clone(),
                    angle,
                    mouseAngle: this.getMouseAngle(),
                    centerDistance,
                };

                drag((dragInfo, event) =>
                {
                    dragHandler(startInfo, dragInfo, event);
                    this.update();
                });
            });
        }

        this.addChild(handle);

        return handle;
    }

    protected setHandlePosition(handle: Graphics, x: number, y: number)
    {
        handle.x = x - halfTransformHandleSize;
        handle.y = y - halfTransformHandleSize;
    }

    public update()
    {
        const { bounds, border, origin, originPos,
            topLeftHandle, topRightHandle, bottomLeftHandle, bottomRightHandle,
            topCenterHandle, rightCenterHandle, bottomCenterHandle, leftCenterHandle } = this;

        const left = 0.5;
        const top = 0.5;
        const right = bounds.width;
        const bottom = bounds.height;
        const midX = right * 0.5;
        const midY = bottom * 0.5;

        // set pivot and rotation
        this.pivot.x = right * originPos.x;
        this.pivot.y = bottom * originPos.y;

        // set location
        this.x = bounds.x;
        this.y = bounds.y;

        // draw border
        border.clear();
        border.lineStyle(1, 0xffffff, 1);
        border.beginFill(0xffffff, 0.01);
        border.drawRect(0.5, 0.5, bounds.width, bounds.height);
        border.endFill();

        // set transform positions
        this.setHandlePosition(topLeftHandle, left, top);
        this.setHandlePosition(topCenterHandle, midX, top);
        this.setHandlePosition(topRightHandle, right, top);
        this.setHandlePosition(rightCenterHandle, right, midY);
        this.setHandlePosition(bottomRightHandle, right, bottom);
        this.setHandlePosition(bottomCenterHandle, midX, bottom);
        this.setHandlePosition(bottomLeftHandle, left, bottom);
        this.setHandlePosition(leftCenterHandle, left, midY);

        // set origin position
        origin.x = right * originPos.x;
        origin.y = bottom * originPos.y;
    }

    protected getMouseAngle()
    {
        const pos = this.origin.getGlobalPosition();
        const mousePos = getWindowMouseClientPosition();
        const angle = angleBetween(pos.x, pos.y, mousePos.x, mousePos.y);

        return angle;
    }

    protected onDragBounds = () =>
    {
        const { bounds } = this;
        const startX = bounds.x;
        const startY = bounds.y;

        drag((dragInfo) =>
        {
            this.bounds.x = startX + dragInfo.x;
            this.bounds.y = startY + dragInfo.y;
            this.update();
        });
    };

    protected getBoundsCenter()
    {
        const bounds = this.bounds;

        return { x: bounds.width * 0.5, y: bounds.height * 0.5 };
    }

    protected onDragOrigin = (e: InteractionEvent) =>
    {
        if (!isKeyPressed('Shift'))
        {
            this.onDragBounds();

            return;
        }

        e.stopPropagation();

        const { bounds, origin } = this;
        const startX = origin.x;
        const startY = origin.y;
        const origBoundsX = bounds.x;
        const origBoundsY = bounds.y;
        const isAltDown = isKeyPressed('Alt');

        drag((dragInfo) =>
        {
            const toX = startX + dragInfo.x;
            const toY = startY + dragInfo.y;

            const deg = angleBetween(startX, startY, toX, toY);
            const l = distanceBetween(startX, startY, toX, toY);
            const { x, y } = polarPoint(deg - this.angle, l, startX, startY);

            const originX = x;
            const originY = y;

            if (isAltDown)
            {
                if (originX < 0 || originY < 0 || originX > bounds.width || originY > bounds.height)
                {
                    return;
                }
            }

            origin.x = originX;
            origin.y = originY;

            this.originPos.x = originX / bounds.width;
            this.originPos.y = originY / bounds.height;

            bounds.x = origBoundsX + dragInfo.x;
            bounds.y = origBoundsY + dragInfo.y;

            this.update();
        });
    };

    protected onDragHorizontal = (startInfo: StartDragInfo, { x }: DragInfo) =>
    {
        this.bounds.width = startInfo.bounds.width + x;
    };

    protected onDragVertical = (startInfo: StartDragInfo, { y }: DragInfo) =>
    {
        this.bounds.height = startInfo.bounds.height + y;
    };

    protected onDragRotation = (startInfo: StartDragInfo) =>
    {
        this.angle = startInfo.angle + (this.getMouseAngle() - startInfo.mouseAngle);
    };
}
