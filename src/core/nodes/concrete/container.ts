import { Container } from 'pixi.js';

import { ModelSchema } from '../../model/schema';
import type { ClonableNode } from '../abstract/clonableNode';
import type { DisplayObjectModel } from '../abstract/displayObject';
import { DisplayObjectNode, displayObjectSchema } from '../abstract/displayObject';

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

    protected initView()
    {
        (this.view as any).id = this.id;
    }

    protected initModel(): void
    {
        //
    }

    public reParentTransform()
    {
        const viewMatrix = this.view.worldTransform.clone();
        const parentMatrix = this.view.parent.worldTransform.clone();

        viewMatrix.prepend(parentMatrix.invert());
        this.view.transform.setFromMatrix(viewMatrix);
    }

    protected addViewToParent(parent: ClonableNode): void
    {
        const thisView = this.view;
        const parentView = parent.getView<Container>();

        parentView.addChildAt(thisView, parent.indexOf(this));
    }

    protected removeViewFromParent(parent: ClonableNode): void
    {
        const thisView = this.view;
        const parentView = parent.getView<Container>();

        parentView.removeChild(thisView);
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

