import type {  InteractionEvent,  Transform } from 'pixi.js';
import { Application, Container, Graphics, Matrix, Rectangle, Sprite, Texture } from 'pixi.js';

import { angleBetween, closestEdgeVertexOnRect, degToRad, distanceBetween, findNearestPointOnRect } from '../core/util/geom';
import Canvas2DPainter from './ui/2dPainter';
import Grid from './ui/grid';

const edgeDragDistance = 15;

type SpriteConfig = {
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    pivotX: number;
    pivotY: number;
};

// create canvas and setup pixi
const canvasWidth = 500;
const canvasHeight = 500;
const painter = new Canvas2DPainter(canvasWidth, canvasHeight, '#ccc');

document.body.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
`;
document.body.appendChild(painter.canvas);

const pixi = new Application({
    view: painter.canvas,
    width: canvasWidth,
    height: canvasHeight,
});

const sprites = new Container();
const edit = new Container();

pixi.stage.addChild(Grid.createTilingSprite(screen.availWidth, screen.availHeight));
pixi.stage.addChild(sprites);
pixi.stage.addChild(edit);

function createSprite(tint: number, config: SpriteConfig, addToStage = true)
{
    const sprite = new Sprite(Texture.WHITE);

    sprite.tint = tint;
    sprite.width = config.width;
    sprite.height = config.height;
    sprite.x = config.x;
    sprite.y = config.y;
    sprite.angle = config.angle;
    sprite.pivot.x = config.pivotX;
    sprite.pivot.y = config.pivotY;

    if (addToStage)
    {
        sprites.addChild(sprite);
        sprite.updateTransform();
    }

    return sprite;
}

// create 3 sprites and setup properties
const spriteConfig: Record<string, SpriteConfig> = {
    red: { x: 100, y: 50, width: 100, height: 50, angle: 0, pivotX: 0, pivotY: 0 },
    green: { x: 250, y: 50, width: 50, height: 100, angle: 45, pivotX: 0, pivotY: 0 },
    blue: { x: 150, y: 150, width: 50, height: 50, angle: 0, pivotX: 0, pivotY: 0 },
};

const red = createSprite(0xff0000, spriteConfig.red);
const green = createSprite(0x009900, spriteConfig.green);
const blue = createSprite(0x0000ff, spriteConfig.blue);

// update transforms before caching matrices
red.updateTransform();
green.updateTransform();
blue.updateTransform();

// calculate bounds
const bounds = sprites.getBounds();

// setup transform state
const transform = {
    matrix: new Matrix(),
    x: 0,
    y: 0,
    pivotX: 0.5,
    pivotY: 0.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
};

// track drag info
type DragMode = 'none' | 'rotation' | 'drag' | 'scale';

interface DragInfo
{
    mode: DragMode;
    cache: typeof transform;
    scale: {
        hArea: 'left' | 'center' | 'right';
        vArea: 'top' | 'center' | 'bottom';
        pivotX: number;
        pivotY: number;
    };
    initial: {
        bounds: Rectangle;
        dragAngle: number;
        dragPointX: number;
        dragPointY: number;
        dragScaleEdgeX: number;
        dragScaleEdgeY: number;
    };
}

const dragInfo: DragInfo = {
    mode: 'none',
    cache: transform,
    scale: {
        hArea: 'center',
        vArea: 'center',
        pivotX: 0,
        pivotY: 0,
    },
    initial: {
        bounds: new Rectangle(),
        dragAngle: 0,
        dragPointX: 0,
        dragPointY: 0,
        dragScaleEdgeX: 0,
        dragScaleEdgeY: 0,
    },
};

// create transform display objects
const graphics = new Graphics();
const container = new Container();

edit.addChild(container);
container.addChild(graphics);

graphics.clear();
graphics.lineStyle(1, 0xffffff, 1);
graphics.beginFill(0xffffff, 0.01);
graphics.drawRect(0.5, 0.5, bounds.width, bounds.height);
graphics.endFill();

function createPoint(tint: number, size = 10)
{
    const point = new Sprite(Texture.WHITE);

    point.tint = tint;
    point.width = point.height = size;
    point.pivot.x = size * 0.5;
    point.pivot.y = size * 0.5;

    container.addChild(point);

    return point;
}

const points = {
    pivot: createPoint(0xffffff),
    nearest: createPoint(0xffff00, 13),
    mouseLocal: createPoint(0x0000ff, 7),
};

const setPoint = (name: keyof typeof points, localX: number, localY: number) =>
{
    const point = points[name];

    point.x = localX;
    point.y = localY;
};

// cache matrices
const matrixCache = {
    red: red.worldTransform.clone(),
    green: green.worldTransform.clone(),
    blue: blue.worldTransform.clone(),
};

// run transform operation
const updateMatrix = (trans: Transform, origMatrix: Matrix) =>
{
    const combinedMatrix = origMatrix.clone();

    combinedMatrix.translate(-bounds.left, -bounds.top);
    combinedMatrix.prepend(transform.matrix);
    trans.setFromMatrix(combinedMatrix);
};

function calcTransform()
{
    const { matrix } = transform;

    // const pivotX = bounds.width * (dragInfo.mode === 'scale' ? dragInfo.scale.pivotX : transform.pivotX);
    // const pivotY = bounds.height * (dragInfo.mode === 'scale' ? dragInfo.scale.pivotY : transform.pivotY);
    const pivotX = bounds.width * transform.pivotX;
    const pivotY = bounds.height * transform.pivotY;

    setPoint('pivot', pivotX, pivotY);

    // reset transform matrix
    matrix.identity();

    // apply negative pivot
    matrix.translate(-pivotX, -pivotY);

    // scale
    matrix.scale(transform.scaleX, transform.scaleY);

    // rotate
    matrix.rotate(degToRad(transform.rotation));

    // move pivot back
    matrix.translate(pivotX, pivotY);

    // translate to transform bounds position
    matrix.translate(bounds.left, bounds.top);

    // translate to transform translation position
    matrix.translate(transform.x, transform.y);

    // update transform container with matrix
    container.transform.setFromMatrix(matrix);
    container.updateTransform();

    // update sprites with transform matrix
    updateMatrix(red.transform, matrixCache.red);
    updateMatrix(green.transform, matrixCache.green);
    updateMatrix(blue.transform, matrixCache.blue);
}

function getPivotGlobalPos()
{
    const localPoint = { x: transform.pivotX * bounds.width, y: transform.pivotY * bounds.height };
    const globalPoint = { x: 0, y: 0 };

    container.worldTransform.apply(localPoint, globalPoint);

    return globalPoint;
}

setInterval(() =>
{
    calcTransform();

    // transform.rotation += 1;
}, 100);

function getLocalPoint(e: InteractionEvent)
{
    const localPoint = container.worldTransform.applyInverse(e.data.global);

    return { x: localPoint.x, y: localPoint.y };
}

function constrainLocalPoint(localPoint: {x: number; y: number})
{
    const p = {
        ...localPoint,
    };

    p.x = Math.min(bounds.width, Math.max(0, localPoint.x));
    p.y = Math.min(bounds.height, Math.max(0, localPoint.y));

    return p;
}

function cacheTransformState(mode: DragMode, e: InteractionEvent)
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;
    const globalPivot = getPivotGlobalPos();
    const localPoint = constrainLocalPoint(getLocalPoint(e));

    dragInfo.mode = mode;

    dragInfo.cache = {
        ...transform,
    };

    dragInfo.initial = {
        bounds: bounds.clone(),
        dragAngle: angleBetween(globalPivot.x, globalPivot.y, globalX, globalY),
        dragPointX: globalX,
        dragPointY: globalY,
        dragScaleEdgeX: localPoint.x,
        dragScaleEdgeY: localPoint.y,
    };

    console.log(dragInfo);
}

graphics.interactive = true;
graphics.on('mousedown', (e: InteractionEvent) =>
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;

    const { x: localX, y: localY } = constrainLocalPoint(getLocalPoint(e));

    setPoint('mouseLocal', localX, localY);

    if (e.data.buttons === 1)
    {
        if (e.data.originalEvent.shiftKey)
        {
            // move pivot
            transform.pivotX = localX / bounds.width;
            transform.pivotY = localY / bounds.height;

            calcTransform();

            const newPoint = getPivotGlobalPos();
            const deltaX = newPoint.x - globalX;
            const deltaY = newPoint.y - globalY;

            transform.x += -deltaX;
            transform.y += -deltaY;

            calcTransform();
        }
        else if (e.data.originalEvent.metaKey)
        {
            // rotation
            cacheTransformState('rotation', e);
        }
        else
        {
            const { distance } = findNearestPointOnRect(
                localX,
                localY,
                0,
                0,
                bounds.width,
                bounds.height,
            );

            if (distance <= edgeDragDistance)
            {
                // scaling
                const { x, y } = closestEdgeVertexOnRect(localX, localY, 0, 0, bounds.width, bounds.height, 0.25);

                dragInfo.scale.hArea = x;
                dragInfo.scale.vArea = y;

                // todo: calculate from vertex area
                dragInfo.scale.pivotX = 0;
                dragInfo.scale.pivotY = 0.5;

                cacheTransformState('scale', e);
            }
            else
            {
                // translation
                cacheTransformState('drag', e);
            }
        }
    }
}).on('mousemove', (e: InteractionEvent) =>
{
    const globalX = e.data.global.x;
    const globalY = e.data.global.y;

    let localPoint = getLocalPoint(e);
    const localX = localPoint.x;
    const localY = localPoint.y;

    localPoint = constrainLocalPoint(localPoint);

    const globalPivot = getPivotGlobalPos();

    const { x, y } = findNearestPointOnRect(
        localX,
        localY,
        0,
        0,
        bounds.width,
        bounds.height,
    );

    setPoint('nearest', x, y);
    setPoint('mouseLocal', localPoint.x, localPoint.y);

    if (dragInfo.mode === 'rotation')
    {
        // rotation
        const angle = angleBetween(globalPivot.x, globalPivot.y, globalX, globalY) - dragInfo.initial.dragAngle;

        transform.rotation = dragInfo.cache.rotation + angle;
    }
    else if (dragInfo.mode === 'drag')
    {
        // drag
        const deltaX = globalX - dragInfo.initial.dragPointX;
        const deltaY = globalY - dragInfo.initial.dragPointY;

        transform.x = dragInfo.cache.x + deltaX;
        transform.y = dragInfo.cache.y + deltaY;
    }
    else if (dragInfo.mode === 'scale')
    {
        // scaling
        if (dragInfo.scale.vArea === 'center')
        {
            const scale = localX / (dragInfo.initial.bounds.width);

            // transform.scaleX = scale;
            console.log(scale);
        }
    }

    calcTransform();
});

window.addEventListener('mouseup', () =>
{
    dragInfo.mode = 'none';
});