import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';
import Color from 'color';
import { EventEmitter } from 'eventemitter3';
import type { DisplayObject, InteractionEvent } from 'pixi.js';
import { Container, Rectangle } from 'pixi.js';

import { Application } from '../../core/application';
import type { TransformGizmo } from './gizmo';
import { type HandleVertexHorizontal, type HandleVertexVertical, TransformGizmoHandle } from './handle';
import { TransformGizmoInfo } from './info';
import type { DragInfo } from './operation';
import { yellowPivot } from './util';

const primaryHandleSize = 10;
const secondaryHandleSize = 7;

export type TransformGizmoFrameEvent = 'mousedown' | 'mousemove' | 'mouseup';

export class TransformGizmoFrame extends EventEmitter<TransformGizmoFrameEvent>
{
    public container: Container;
    public primaryHandles: Container;
    public secondaryHandles: Container;
    public border: Graphics;
    public pivotView: DisplayObject;
    public info: TransformGizmoInfo;

    public topLeftHandle: TransformGizmoHandle;
    public topRightHandle: TransformGizmoHandle;
    public bottomRightHandle: TransformGizmoHandle;
    public bottomLeftHandle: TransformGizmoHandle;

    public topCenterHandle: TransformGizmoHandle;
    public rightCenterHandle: TransformGizmoHandle;
    public bottomCenterHandle: TransformGizmoHandle;
    public leftCenterHandle: TransformGizmoHandle;

    constructor(public readonly gizmo: TransformGizmo)
    {
        super();

        this.container = new Container();
        this.primaryHandles = new Container();
        this.secondaryHandles = new Container();
        this.border = new Graphics();
        this.border.interactive = true;

        this.pivotView = yellowPivot;
        this.info = new TransformGizmoInfo(this);

        this.container.addChild(this.border);
        this.container.addChild(this.pivotView);
        this.container.addChild(this.primaryHandles);
        this.container.addChild(this.secondaryHandles);
        this.container.addChild(this.info);

        this.topLeftHandle = this.createHandle(primaryHandleSize, 'left', 'top');
        this.topRightHandle = this.createHandle(primaryHandleSize, 'right', 'top');
        this.bottomRightHandle = this.createHandle(primaryHandleSize, 'right', 'bottom');
        this.bottomLeftHandle = this.createHandle(primaryHandleSize, 'left', 'bottom');

        this.topCenterHandle = this.createHandle(secondaryHandleSize, 'center', 'top', false);
        this.rightCenterHandle = this.createHandle(secondaryHandleSize, 'right', 'center', false);
        this.bottomCenterHandle = this.createHandle(secondaryHandleSize, 'center', 'bottom', false);
        this.leftCenterHandle = this.createHandle(secondaryHandleSize, 'left', 'center', false);

        this.initEvents();
    }

    protected get matrix()
    {
        return this.gizmo.matrix;
    }

    protected createHandle(size: number, h: HandleVertexHorizontal, v: HandleVertexVertical, isPrimary = true)
    {
        const vertex = { h, v };
        const handle = new TransformGizmoHandle(size, vertex);

        if (isPrimary)
        {
            this.primaryHandles.addChild(handle);
        }
        else
        {
            this.secondaryHandles.addChild(handle);
        }

        handle
            .on('mousedown', (e: InteractionEvent) =>
            {
                this.gizmo.setActiveVertex(vertex);
                this.gizmo.onMouseDown(e);
                e.stopPropagation();
            })
            .on('mousemove', this.gizmo.onMouseMove);

        return handle;
    }

    protected initEvents()
    {
        const { border } = this;

        border
            .on('mousedown', this.gizmo.onMouseDown)
            .on('mousemove', this.gizmo.onMouseMove);

        window.addEventListener('mouseup', this.gizmo.onMouseUp);
    }

    public getGlobalBounds()
    {
        const { gizmo, matrix } = this;

        if (Application.instance.selection.length === 0)
        {
            return Rectangle.EMPTY;
        }

        const { initialTransform: { localBounds } } = gizmo;
        const { left, top, width, height } = localBounds;
        const p1 = matrix.apply({ x: left, y: top });
        const p2 = matrix.apply({ x: width + left, y: top });
        const p3 = matrix.apply({ x: width + left, y: height + top });
        const p4 = matrix.apply({ x: left, y: height + top });
        const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
        const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
        const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
        const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

        const rect = new Rectangle(minX, minY, maxX - minX, maxY - minY);

        return rect;
    }

    protected drawSelected()
    {
        const { border } = this;

        Application.instance.selection.forEach((node) =>
        {
            const matrix = node.view.worldTransform;
            const width = node.width;
            const height = node.height;
            const p1 = matrix.apply({ x: 0, y: 0 });
            const p2 = matrix.apply({ x: width, y: 0 });
            const p3 = matrix.apply({ x: width, y: height });
            const p4 = matrix.apply({ x: 0, y: height });

            border.lineStyle(2, Color('cyan').rgbNumber(), 1);
            border.moveTo(p1.x, p1.y); border.lineTo(p2.x, p2.y);
            border.moveTo(p2.x, p2.y); border.lineTo(p3.x, p3.y);
            border.moveTo(p3.x, p3.y); border.lineTo(p4.x, p4.y);
            border.moveTo(p4.x, p4.y); border.lineTo(p1.x, p1.y);
        });
    }

    protected drawBorder()
    {
        const { border, matrix, gizmo: { initialTransform: { localBounds }, config } } = this;

        if (config.showTransformBorder)
        {
            const { left, top, width, height } = localBounds;
            const p1 = matrix.apply({ x: left, y: top });
            const p2 = matrix.apply({ x: width + left, y: top });
            const p3 = matrix.apply({ x: width + left, y: height + top });
            const p4 = matrix.apply({ x: left, y: height + top });

            const path = [p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y];

            border.beginFill(0xffffff, 0.05);
            border.drawPolygon(path);
            border.endFill();

            border.lineStyle(1, 0xffffff, 1);
            border.moveTo(p1.x, p1.y); border.lineTo(p2.x, p2.y);
            border.moveTo(p2.x, p2.y); border.lineTo(p3.x, p3.y);
            border.moveTo(p3.x, p3.y); border.lineTo(p4.x, p4.y);
            border.moveTo(p4.x, p4.y); border.lineTo(p1.x, p1.y);
        }

        if (config.showEncompassingBorder)
        {
            const globalBounds = this.gizmo.getContentGlobalBounds();

            border.lineStyle(1, 0xffffff, 0.4);
            border.beginFill(0xffffff, 0.025);
            border.drawRect(globalBounds.left, globalBounds.top, globalBounds.width, globalBounds.height);
            border.endFill();
        }
    }

    protected drawPivot()
    {
        const { gizmo, pivotView } = this;
        const { pivotGlobalPos, rotation, config } = gizmo;

        if (config.showPivot)
        {
            if (!pivotView.visible)
            {
                pivotView.visible = true;
            }
            pivotView.x = pivotGlobalPos.x;
            pivotView.y = pivotGlobalPos.y;
            pivotView.angle = rotation;
        }
        else if (pivotView.visible)
        {
            pivotView.visible = false;
        }
    }

    protected drawHandles()
    {
        const {
            gizmo,
            matrix,
            topLeftHandle, topRightHandle, bottomRightHandle, bottomLeftHandle,
            topCenterHandle, rightCenterHandle, bottomCenterHandle, leftCenterHandle,
            primaryHandles, secondaryHandles,
        } = this;
        const { initialTransform: { localBounds }, config } = gizmo;

        const { left, top, width, height } = localBounds;
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        if (config.showPrimaryHandles)
        {
            const p1 = matrix.apply({ x: left, y: top });
            const p2 = matrix.apply({ x: width + left, y: top });
            const p3 = matrix.apply({ x: width + left, y: height + top });
            const p4 = matrix.apply({ x: left, y: height + top });

            this.drawHandle(topLeftHandle, p1.x, p1.y);
            this.drawHandle(topRightHandle, p2.x, p2.y);
            this.drawHandle(bottomRightHandle, p3.x, p3.y);
            this.drawHandle(bottomLeftHandle, p4.x, p4.y);

            if (!primaryHandles.visible)
            {
                primaryHandles.visible = true;
            }
        }
        else if (primaryHandles.visible)
        {
            primaryHandles.visible = false;
        }

        if (config.showSecondaryHandles)
        {
            const p5 = matrix.apply({ x: centerX + left, y: top });
            const p6 = matrix.apply({ x: width + left, y: centerY + top });
            const p7 = matrix.apply({ x: centerX + left, y: height + top });
            const p8 = matrix.apply({ x: left, y: centerY + top });

            this.drawHandle(topCenterHandle, p5.x, p5.y);
            this.drawHandle(rightCenterHandle, p6.x, p6.y);
            this.drawHandle(bottomCenterHandle, p7.x, p7.y);
            this.drawHandle(leftCenterHandle, p8.x, p8.y);

            if (!secondaryHandles.visible)
            {
                secondaryHandles.visible = true;
            }
        }
        else if (secondaryHandles.visible)
        {
            secondaryHandles.visible = false;
        }
    }

    protected drawHandle(handle: TransformGizmoHandle, x: number, y: number)
    {
        const { rotation } = this.gizmo;

        handle.x = x;
        handle.y = y;
        handle.angle = rotation;
    }

    public update()
    {
        this.border.clear();

        this.drawSelected();
        this.drawBorder();
        this.drawPivot();
        this.drawHandles();
    }

    public setPivotView(pivotView: DisplayObject)
    {
        this.container.removeChild(this.pivotView);
        this.container.addChild(pivotView);
        this.pivotView = pivotView;
        this.drawPivot();
    }

    public startOperation(dragInfo: DragInfo)
    {
        this.info.visible = true;
        this.info.update(dragInfo);
    }

    public updateOperation(dragInfo: DragInfo)
    {
        this.info.update(dragInfo);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public endOperation(dragInfo: DragInfo)
    {
        this.info.visible = false;
    }
}
