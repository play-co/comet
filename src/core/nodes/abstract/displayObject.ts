import { type DisplayObject, Rectangle } from 'pixi.js';

import { NumericRangeLimitConstraint, ReferenceConstraint } from '../../model/constraints';
import type { ModelBase } from '../../model/model';
import { ModelSchema } from '../../model/schema';
import { ClonableNode } from './clonableNode';

export interface DisplayObjectModel extends ModelBase
{
    x: number;
    y: number;
    pivotX: number;
    pivotY: number;
    skewX: number;
    skewY: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    alpha: number;
    visible: boolean;
}

export const displayObjectSchema = new ModelSchema<DisplayObjectModel>({
    x: 0,
    y: 0,
    pivotX: 0,
    pivotY: 0,
    skewX: 0,
    skewY: 0,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    alpha: 1,
    visible: true,
}, {
    '*': [new ReferenceConstraint<DisplayObjectModel>(['x', 'y'])],
    alpha: [new NumericRangeLimitConstraint(0, 1)],
});

export abstract class DisplayObjectNode<
    M extends DisplayObjectModel = DisplayObjectModel,
    V extends DisplayObject = DisplayObject,
> extends ClonableNode<M, V>
{
    public modelSchema(): ModelSchema<M>
    {
        return displayObjectSchema as unknown as ModelSchema<M>;
    }

    public updateView(): void
    {
        const {
            values: {
                x, y,
                pivotX, pivotY,
                scaleX, scaleY,
                skewX, skewY,
                angle,
                alpha,
                visible,
            },
            view,
        } = this;

        view.x = x; view.y = y;
        view.pivot.x = pivotX; view.pivot.y = pivotY;
        view.scale.x = scaleX; view.scale.y = scaleY;
        view.skew.x = skewX; view.skew.y = skewY;
        view.angle = angle;
        view.alpha = alpha;
        view.visible = visible;
    }

    public getLocalBounds()
    {
        return this.view.getLocalBounds();
    }

    public getGlobalBounds(includeChildren = true)
    {
        if (includeChildren)
        {
            return this.view.getBounds();
        }
        const { naturalWidth, naturalHeight } = this;
        const matrix = this.view.worldTransform;
        const p1 = matrix.apply({ x: 0, y: 0 });
        const p2 = matrix.apply({ x: naturalWidth, y: 0 });
        const p3 = matrix.apply({ x: naturalWidth, y: naturalHeight });
        const p4 = matrix.apply({ x: 0, y: naturalHeight });
        const left = Math.min(p1.x, p2.x, p3.x, p4.x);
        const right = Math.max(p1.x, p2.x, p3.x, p4.x);
        const top = Math.min(p1.y, p2.y, p3.y, p4.y);
        const bottom = Math.max(p1.y, p2.y, p3.y, p4.y);

        return new Rectangle(left, top, right - left, bottom - top);
    }

    public containsPoint(globalX: number, globalY: number)
    {
        const view = this.view;
        const localPoint = view.worldTransform.applyInverse({ x: globalX, y: globalY });

        return this.getLocalBounds().contains(localPoint.x, localPoint.y);
    }

    // not the localBounds (which includes the children, but the single local dimension of this view)
    public abstract get naturalWidth(): number;
    public abstract get naturalHeight(): number;
}
