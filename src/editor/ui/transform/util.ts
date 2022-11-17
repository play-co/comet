import type { DisplayObject } from 'pixi.js';
import { Graphics, Matrix, Rectangle, Transform } from 'pixi.js';

import type { DisplayObjectNode } from '../../../core/nodes/abstract/displayObject';
import { angleBetween, degToRad } from '../../../core/util/geom';

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

(window as any).round = round;

export function updateTransforms(view: DisplayObject)
{
    const views: DisplayObject[] = [view];
    let ref = view;

    while (ref.parent)
    {
        views.push(ref);
        ref = ref.parent;
    }

    views.reverse();

    for (const obj of views)
    {
        obj.updateTransform();
    }
}

export function getGizmoInitialTransformFromView(node: DisplayObjectNode, parentMatrix: Matrix): InitialGizmoTransform
{
    const view = node.view;
    const { worldTransform } = view;

    updateTransforms(view);

    const matrix = worldTransform.clone();

    matrix.prepend(parentMatrix.clone().invert());

    const transform = new Transform();

    decomposeTransform(transform, matrix, undefined, view.pivot);

    const naturalWidth = node.naturalWidth;
    const naturalHeight = node.naturalHeight;

    const localBounds = view.getLocalBounds();

    const width = localBounds.width;
    const height = localBounds.height;

    const p1 = matrix.apply({ x: 0, y: 0 });
    const p2 = matrix.apply({ x: width, y: 0 });
    const p0 = matrix.apply({ x: view.pivot.x, y: view.pivot.y });

    const rotation = angleBetween(p1.x, p1.y, p2.x, p2.y);
    const x = p0.x + 0;
    const y = p0.y + 0;
    const pivotX = view.pivot.x;
    const pivotY = view.pivot.y;
    const scaleX = transform.scale.x;
    const scaleY = transform.scale.y;
    const skewX = transform.skew.x;
    const skewY = transform.skew.y;

    transform.scale.x = scaleX;
    transform.scale.y = scaleY;
    transform.rotation = degToRad(rotation);
    transform.pivot.x = pivotX;
    transform.pivot.y = pivotY;
    transform.position.x = x;
    transform.position.y = y;
    transform.skew.x = skewX;
    transform.skew.y = skewY;

    transform.updateLocalTransform();

    return {
        localBounds,
        matrix: transform.localTransform,
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

export function getTotalGlobalBounds<T extends DisplayObjectNode>(nodes: T[])
{
    let rect = Rectangle.EMPTY;

    nodes.forEach((node) =>
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
    });

    return rect;
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
