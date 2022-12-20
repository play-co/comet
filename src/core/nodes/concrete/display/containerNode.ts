import { Container, Transform } from 'pixi.js';

import { decomposeTransform } from '../../../../editor/ui/transform/util';
import { ModelSchema } from '../../../model/schema';
import type { ClonableNode } from '../../abstract/clonableNode';
import type { DisplayObjectModel } from '../../abstract/displayObjectNode';
import { DisplayObjectNode, displayObjectSchema } from '../../abstract/displayObjectNode';

export type ContainerModel = DisplayObjectModel;

export const containerSchema = new ModelSchema<ContainerModel>(displayObjectSchema.properties);

export class ContainerNode<
    M extends ContainerModel = ContainerModel,
    V extends Container = Container,
> extends DisplayObjectNode<M, V>
{
    public get width(): number
    {
        return 0;
    }

    public get height(): number
    {
        return 0;
    }

    public nodeType()
    {
        return 'Container';
    }

    public modelSchema(): ModelSchema<M>
    {
        return containerSchema as unknown as ModelSchema<M>;
    }

    public createView(): V
    {
        return new Container() as V;
    }

    public reParentTransform()
    {
        const thisView = this.view;
        const parentView = this.view.parent;

        thisView.updateTransform();
        parentView.updateTransform();

        const viewMatrix = thisView.worldTransform.clone();
        const parentMatrix = parentView.worldTransform.clone();

        viewMatrix.prepend(parentMatrix.invert());
        thisView.transform.setFromMatrix(viewMatrix);
    }

    public test()
    {
        const thisView = this.view;
        const parentView = this.view.parent;

        thisView.updateTransform();
        parentView.updateTransform();

        const viewMatrix = thisView.worldTransform.clone();

        const transform = new Transform();

        decomposeTransform(transform, viewMatrix, undefined, { x: 0, y: 0 } as any);

        return transform;
    }

    protected addViewToParent(parent: ClonableNode): void
    {
        const thisView = this.view;
        const parentView = parent.getView<Container>();

        if (parentView)
        {
            parentView.addChildAt(thisView, parent.indexOf(this));
        }
    }

    protected removeViewFromParent(parent: ClonableNode): void
    {
        const thisView = this.view;
        const parentView = parent.getView<Container>();

        if (parentView)
        {
            parentView.removeChild(thisView);
        }
    }

    public updateViewIndex()
    {
        const { parent } = this;

        if (parent)
        {
            const thisView = this.view;
            const parentView = parent.asClonableNode().getView<Container>();

            parentView.setChildIndex(thisView, parent.indexOf(this));
        }
    }

    public reorderChildren(childIds: string[]): void
    {
        super.reorderChildren(childIds);

        this.children
            .filter((node) => !node.asClonableNode().isCloaked)
            .forEach((node) => node.cast<ContainerNode>().updateViewIndex());
    }

    protected onCloaked(): void
    {
        this.removeViewFromParent(this.getParent<ClonableNode>());
    }

    protected onUncloaked(): void
    {
        this.addViewToParent(this.getParent<ClonableNode>());
    }
}

