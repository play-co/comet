import type { Point } from '../../../../core/util/geom';
import type { DragInfo } from '../operation';
import { ScaleOperation } from './scale';

export class ScaleByEdgeOperation extends ScaleOperation
{
    public init(dragInfo: DragInfo): void
    {
        const { gizmo: { vertex } } = this;
        const { isAltDown } = dragInfo;

        super.init(dragInfo);

        if (isAltDown)
        {
            this.setPivot(0.5, 0.5);
        }
        else
        {
            this.setPivotFromVertex(vertex);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected calcDelta(dragInfo: DragInfo, delta: Point): boolean
    {
        const { duplex } = this;
        const { isAltDown } = dragInfo;

        if (isAltDown)
        {
            if (!duplex)
            {
                // reset drag scaling state
                this.end(dragInfo);
                this.gizmo.updateTransform();
                this.init(dragInfo);

                // enable duplex
                this.duplex = true;

                this.setPivot(0.5, 0.5);

                return false;
            }
        }
        else
        if (duplex)
        {
            // disable duplex
            this.duplex = false;

            // reset drag scaling state
            this.end(dragInfo);
            this.gizmo.updateTransform();
            this.init(dragInfo);

            return false;
        }

        if (this.duplex)
        {
            delta.x *= 2;
            delta.y *= 2;
        }

        return true;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public end(dragInfo: DragInfo): void
    {
        const { gizmo: { initialTransform: { width, height, localBounds }, selection } } = this;
        const isContainerSelected = selection.isSingle && selection.firstItem.nodeType() === 'Container';

        let pivotX = this.readCache('pivotX');
        let pivotY = this.readCache('pivotY');

        if (isContainerSelected)
        {
            pivotX = pivotX - localBounds.left;
            pivotY = pivotY - localBounds.top;
        }

        const origPivotX = pivotX / width;
        const origPivotY = pivotY / height;

        this.setPivot(origPivotX, origPivotY);
    }
}
