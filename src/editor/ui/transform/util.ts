import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';
import type { Container, DisplayObject } from 'pixi.js';
import { Matrix, Rectangle, Transform } from 'pixi.js';

import type { ClonableNode } from '../../../core';
import { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { angleBetween } from '../../../core/util/geom';

export interface InitialGizmoTransform
{
    localBounds: Rectangle;
    pivotX: number;
    pivotY: number;
    x: number;
    y: number;
    rotation: number;
    naturalWidth: number;
    naturalHeight: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
    matrix: Matrix;
}

export function round(num: number, places: number)
{
    const factor = Math.pow(10, places);

    return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function getGizmoInitialTransformFromView(
    view: DisplayObject,
    naturalWidth: number,
    naturalHeight: number,
    parentMatrix: Matrix,
): InitialGizmoTransform
{
    view.updateTransform();

    const matrix = view.worldTransform.clone();

    matrix.prepend(parentMatrix.clone().invert());

    const transform = new Transform();

    decomposeTransform(transform, matrix, undefined, view.pivot);

    const localBounds = view.getLocalBounds();

    const width = localBounds.width;
    const height = localBounds.height;

    const p1 = matrix.apply({ x: 0, y: 0 });
    const p2 = matrix.apply({ x: width, y: 0 });
    const p0 = matrix.apply({ x: view.pivot.x, y: view.pivot.y });

    const rotation = angleBetween(p1.x, p1.y, p2.x, p2.y);
    const x = p0.x;
    const y = p0.y;
    const pivotX = view.pivot.x;
    const pivotY = view.pivot.y;
    const scaleX = transform.scale.x;
    const scaleY = transform.scale.y;
    const skewX = transform.skew.x;
    const skewY = transform.skew.y;

    return {
        localBounds,
        matrix: view.worldTransform.clone(),
        naturalWidth,
        naturalHeight,
        width,
        height,
        rotation,
        x,
        y,
        pivotX,
        pivotY,
        scaleX,
        scaleY,
        skewX,
        skewY,
    };
}

export function getTotalGlobalBounds<T extends ClonableNode>(nodes: T[])
{
    let rect = Rectangle.EMPTY;

    nodes.forEach((node) =>
    {
        if (node instanceof DisplayObjectNode)
        {
            node.view.updateTransform();

            const bounds = node.getGlobalBounds();

            if (rect.width === 0 && rect.height === 0 && rect.x === 0 && rect.y === 0)
            {
                rect = bounds.clone();
            }
            else
            {
                rect.enlarge(bounds);
            }
        }
    });

    return rect;
}

export function getViewChildrenLocalBounds<T extends Container>(view: T, excludeChild: DisplayObject)
{
    let rect = Rectangle.EMPTY;

    view.updateTransform();

    view.children.forEach((view: DisplayObject) =>
    {
        if (view === excludeChild)
        {
            return;
        }

        const bounds = view.getBounds();

        if (rect.width === 0 && rect.height === 0 && rect.x === 0 && rect.y === 0)
        {
            rect = bounds.clone();
        }
        else
        {
            rect.enlarge(bounds);
        }
    });

    const p1 = view.worldTransform.applyInverse({ x: rect.left, y: rect.top });
    const p2 = view.worldTransform.applyInverse({ x: rect.right, y: rect.bottom });

    return {
        minX: p1.x,
        minY: p1.y,
        maxX: p2.x,
        maxY: p2.y,
    };
}

export function decomposeTransform(
    transform: Transform,
    matrix: Matrix,
    rotation?: number,
    pivot = transform.pivot,
): Transform
{
    const a = matrix.a;
    const b = matrix.b;
    const c = matrix.c;
    const d = matrix.d;

    const skewX = -Math.atan2(-c, d);
    const skewY = Math.atan2(b, a);

    rotation = rotation !== undefined && rotation !== null ? rotation : skewY;

    // set pivot
    transform.pivot.set(pivot.x, pivot.y);

    // next set rotation, skew angles
    transform.rotation = rotation;
    transform.skew.x = rotation + skewX;
    transform.skew.y = -rotation + skewY;

    // next set scale
    transform.scale.x = Math.sqrt((a * a) + (b * b));
    transform.scale.y = Math.sqrt((c * c) + (d * d));

    // next set position
    transform.position.x = matrix.tx + ((pivot.x * matrix.a) + (pivot.y * matrix.c));
    transform.position.y = matrix.ty + ((pivot.x * matrix.b) + (pivot.y * matrix.d));

    return transform;
}

export function snapToIncrement(val: number, increment: number)
{
    return Math.round(val / increment) * increment;
}

export interface PivotConfig
{
    radius: number;
    lineColor: number;
    bgColor: number;
    bgAlpha: number;
    crosshairSize: number;
    showCircle: boolean;
}

export function createPivotShape(config: PivotConfig)
{
    const { radius, lineColor, bgColor, bgAlpha, crosshairSize } = config;
    const pivotShape = new Graphics();

    pivotShape.lineStyle(1, lineColor, 1);

    pivotShape.beginFill(bgColor, bgAlpha);
    config.showCircle && pivotShape.drawCircle(0, 0, radius);

    if (crosshairSize > 0)
    {
        pivotShape.moveTo(0, crosshairSize * -1); pivotShape.lineTo(0, crosshairSize);
        pivotShape.moveTo(crosshairSize * -1, 0); pivotShape.lineTo(crosshairSize, 0);
    }

    pivotShape.endFill();

    return pivotShape;
}

export const yellowPivot = createPivotShape({
    radius: 7,
    lineColor: 0xffff00,
    bgColor: 0xffffff,
    bgAlpha: 0.1,
    crosshairSize: 12,
    showCircle: true,
});

export const bluePivot = createPivotShape({
    radius: 5,
    lineColor: 0xffffff,
    bgColor: 0x0000ff,
    bgAlpha: 1,
    crosshairSize: 10,
    showCircle: true,
});

export const defaultInitialGizmoTransform: InitialGizmoTransform = {
    localBounds: Rectangle.EMPTY,
    pivotX: 0,
    pivotY: 0,
    x: 0,
    y: 0,
    rotation: 0,
    naturalWidth: 0,
    naturalHeight: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    matrix: Matrix.IDENTITY,
};
