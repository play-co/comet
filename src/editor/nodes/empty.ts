import { type DisplayObject, type Transform, Container, Matrix } from 'pixi.js';

import { ModelSchema } from '../../core/model/schema';
import { displayObjectSchema } from '../../core/nodes/abstract/displayObject';
import { type ContainerModel, ContainerNode } from '../../core/nodes/concrete/container';
import { createPivotShape } from '../ui/transform/util';

const radius = 10;

export const emptySchema = new ModelSchema<ContainerModel>({
    ...displayObjectSchema.properties,
    pivotX: {
        defaultValue: radius,
        category: 'transform',
    },
    pivotY: {
        defaultValue: radius,
        category: 'transform',
    },
});

export class EmptyNode extends ContainerNode<ContainerModel, Container>
{
    public get width(): number
    {
        return radius * 2;
    }

    public get height(): number
    {
        return radius * 2;
    }

    public nodeType()
    {
        return 'Empty';
    }

    public modelSchema(): ModelSchema<ContainerModel>
    {
        return emptySchema;
    }

    public createView(): Container<DisplayObject>
    {
        const container = new Container();

        const yellowPivot = createPivotShape({
            radius,
            lineColor: 0xffff00,
            bgColor: 0xffffff,
            bgAlpha: 0.1,
            crosshairSize: 8,
            showCircle: true,
        });

        yellowPivot.x = radius;
        yellowPivot.y = radius;

        const pivot = (yellowPivot as any);

        // const t = pivot._calculateBounds;

        // const thisView = container;

        pivot._calculateBounds = function _calculateBounds()
        {
            // const bounds = getViewChildrenLocalBounds(thisView, pivot);

            // t.call(pivot);

            // this._bounds.minX = bounds.minX;
            // this._bounds.minY = bounds.minY;
            // this._bounds.maxX = bounds.maxX;
            // this._bounds.maxY = bounds.maxY;
        };

        pivot.transform.updateTransform = function updateTransform(parentTransform: Transform)
        {
            const lt = this.localTransform;

            if (this._localID !== this._currentLocalID)
            {
                // get the matrix values of the displayobject based on its transform properties..
                lt.a = this._cx * this.scale.x;
                lt.b = this._sx * this.scale.x;
                lt.c = this._cy * this.scale.y;
                lt.d = this._sy * this.scale.y;

                lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
                lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
                this._currentLocalID = this._localID;

                // force an update..
                this._parentID = -1;
            }

            if (this._parentID !== parentTransform._worldID)
            {
                // concat the parent matrix with the objects transform.
                const pt = parentTransform.worldTransform;
                const wt = this.worldTransform;

                wt.a = (lt.a * pt.a) + (lt.b * pt.c);
                wt.b = (lt.a * pt.b) + (lt.b * pt.d);
                wt.c = (lt.c * pt.a) + (lt.d * pt.c);
                wt.d = (lt.c * pt.b) + (lt.d * pt.d);
                wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
                wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;

                const matrix = new Matrix();

                matrix.scale(1 / parentTransform.scale.x, 1 / parentTransform.scale.y);

                wt.append(matrix);

                this._parentID = parentTransform._worldID;

                // update the id of the transform..
                this._worldID++;
            }
        };

        container.addChild(yellowPivot);

        return container;
    }
}

