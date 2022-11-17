import { type Point, rotatePointAround } from '../../../../core/util/geom';
import type { HandleVertex } from '../handle';
import { type DragInfo, TransformOperation } from '../operation';
import { snapToIncrement } from '../util';

export abstract class ScaleOperation extends TransformOperation<
'pivotX' | 'pivotY' | 'globalX' | 'globalY' | 'width' | 'height' | 'scaleX' | 'scaleY'
>
{
    public duplex = false;

    public init(dragInfo: DragInfo): void
    {
        const { gizmo: { initialTransform: { width, height } }, gizmo } = this;

        this.writeCache('pivotX', gizmo.pivotX);
        this.writeCache('pivotY', gizmo.pivotY);
        this.writeCache('globalX', dragInfo.globalX);
        this.writeCache('globalY', dragInfo.globalY);
        this.writeCache('width', width * gizmo.scaleX);
        this.writeCache('height', height * gizmo.scaleY);
        this.writeCache('scaleX', gizmo.scaleX);
        this.writeCache('scaleY', gizmo.scaleY);

        if (dragInfo.isAltDown)
        {
            this.duplex = true;
        }
        else
        {
            this.duplex = false;
        }
    }

    public drag(dragInfo: DragInfo): void
    {
        const { gizmo: { rotation, pivotGlobalPos } } = this;
        const { globalX, globalY } = dragInfo;
        const dragPointX = this.readCache('globalX');
        const dragPointY = this.readCache('globalY');
        const p1 = rotatePointAround(globalX, globalY, -rotation, pivotGlobalPos.x, pivotGlobalPos.y);
        const p2 = rotatePointAround(dragPointX, dragPointY, -rotation, pivotGlobalPos.x, pivotGlobalPos.y);
        const delta: Point = {
            x: (p1.x - p2.x),
            y: (p1.y - p2.y),
        };

        if (this.calcDelta(dragInfo, delta))
        {
            this.setScale(dragInfo, delta);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected calcDelta(dragInfo: DragInfo, delta: Point): boolean
    {
        return true;
    }

    protected setPivotFromVertex(vertex: HandleVertex)
    {
        let h = 0.5;
        let v = 0.5;

        if (vertex.h === 'left')
        {
            h = 1;
        }
        else if (vertex.h === 'right')
        {
            h = 0;
        }

        if (vertex.v === 'top')
        {
            v = 1;
        }
        else if (vertex.v === 'bottom')
        {
            v = 0;
        }

        this.setPivot(h, v);
    }

    protected setPivot(xFrac: number, yFrac: number)
    {
        const { gizmo: { initialTransform: { localBounds } }, gizmo } = this;
        const { width, height, top, left } = localBounds;
        const localX = (width * xFrac) + left;
        const localY = (height * yFrac) + top;

        this.gizmo.updateTransform();
        gizmo.setPivot(localX, localY);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected setScale(dragInfo: DragInfo, delta: Point)
    {
        const { gizmo, gizmo: { vertex: v, initialTransform, gridXUnit, gridYUnit } } = this;
        const vertex = `${v.h}-${v.v}`;
        const width = this.readCache('width');
        const height = this.readCache('height');

        let scaleX = this.readCache('scaleX');
        let scaleY = this.readCache('scaleY');

        if (
            vertex === 'left-top'
                || vertex === 'left-center'
                || vertex === 'left-bottom'
        )
        {
            delta.x *= -1;
        }

        if (
            vertex === 'left-top'
                || vertex === 'center-top'
                || vertex === 'right-top'
        )
        {
            delta.y *= -1;
        }

        if (
            vertex === 'left-top'
                || vertex === 'left-center'
                || vertex === 'left-bottom'
                || vertex === 'right-top'
                || vertex === 'right-center'
                || vertex === 'right-bottom'
        )
        {
            scaleX = ((width + delta.x) / width) * this.readCache('scaleX');
        }

        if (
            vertex === 'left-top'
                || vertex === 'center-top'
                || vertex === 'right-top'
                || vertex === 'left-bottom'
                || vertex === 'center-bottom'
                || vertex === 'right-bottom'
        )
        {
            scaleY = ((height + delta.y) / height) * this.readCache('scaleY');
        }

        if (dragInfo.isShiftDown)
        {
            const w = initialTransform.naturalWidth * scaleX;
            const h = initialTransform.naturalHeight * scaleY;
            const snappedW = snapToIncrement(w, gridXUnit);
            const snappedH = snapToIncrement(h, gridYUnit);
            const deltaH = snappedW / w;
            const deltaV = snappedH / h;

            scaleX *= deltaH;
            scaleY *= deltaV;
        }

        gizmo.scaleX = scaleX;
        gizmo.scaleY = scaleY;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public end(dragInfo: DragInfo): void
    {
        //
    }
}
