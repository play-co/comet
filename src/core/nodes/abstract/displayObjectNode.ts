import { type DisplayObject, Rectangle } from 'pixi.js';

import { NumericRangeLimitConstraint } from '../../model/constraints';
import { ModelSchema } from '../../model/schema';
import { type ClonableNodeModel, ClonableNode, clonableNodeSchema } from './clonableNode';

export interface DisplayObjectModel extends ClonableNodeModel
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
    ...clonableNodeSchema.properties,
    x: {
        defaultValue: 0,
        category: 'transform',
        isRootValue: true,
    },
    y: {
        defaultValue: 0,
        category: 'transform',
        isRootValue: true,
    },
    pivotX: {
        defaultValue: 0,
        category: 'transform',
    },
    pivotY: {
        defaultValue: 0,
        category: 'transform',
    },
    skewX: {
        defaultValue: 0,
        category: 'transform',
        isRootValue: true,
    },
    skewY: {
        defaultValue: 0,
        category: 'transform',
        isRootValue: true,
    },
    scaleX: {
        defaultValue: 1,
        category: 'transform',
        isRootValue: true,
    },
    scaleY: {
        defaultValue: 1,
        category: 'transform',
        isRootValue: true,
    },
    angle: {
        defaultValue: 0,
        category: 'transform',
        isRootValue: true,
    },
    alpha: {
        defaultValue: 1,
        category: 'display',
        constraints: [new NumericRangeLimitConstraint(0, 1)],
    },
    visible: {
        defaultValue: true,
        category: 'display',
    },
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

    protected resetView()
    {
        this.view = this.createView();
        this.initView();
        if (this.parent)
        {
            this.addViewToParent(this.parent.cast());
        }
        this.updateView();
    }

    protected initView()
    {
        // eslint-disable-next-line camelcase
        (this.view as any).__node_id = this.id;
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
            // return global bounds encompassing children
            return this.view.getBounds();
        }

        // project the natural local bounds (excluding children) to global space
        const { width, height } = this;
        const matrix = this.view.worldTransform;
        const p1 = matrix.apply({ x: 0, y: 0 });
        const p2 = matrix.apply({ x: width, y: 0 });
        const p3 = matrix.apply({ x: width, y: height });
        const p4 = matrix.apply({ x: 0, y: height });
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

    public localToGlobal(localX: number, localY: number)
    {
        const view = this.view;

        return view.worldTransform.apply({ x: localX, y: localY });
    }

    public globalToLocal(globalX: number, globalY: number)
    {
        const view = this.view;

        return view.worldTransform.applyInverse({ x: globalX, y: globalY });
    }

    // not the localBounds (which includes the children, but the single local dimension of this view)
    public abstract get width(): number;
    public abstract get height(): number;
}
