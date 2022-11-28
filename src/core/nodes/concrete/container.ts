import { Container } from 'pixi.js';

import { ModelSchema } from '../../model/schema';
import type { ClonableNode } from '../abstract/clonableNode';
import type { DisplayObjectModel } from '../abstract/displayObject';
import { DisplayObjectNode, displayObjectSchema } from '../abstract/displayObject';

export type ContainerModel = DisplayObjectModel;

export const containerSchema = new ModelSchema<ContainerModel>({
    ...displayObjectSchema.defaults,
}, displayObjectSchema.constraints);

export class ContainerNode<
    M extends ContainerModel = ContainerModel,
    V extends Container = Container,
> extends DisplayObjectNode<M, V>
{
    public get naturalWidth(): number
    {
        return 0;
    }

    public get naturalHeight(): number
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

    protected onCloaked(): void
    {
        this.removeViewFromParent(this.getParent<ClonableNode>());
    }

    protected onUncloaked(): void
    {
        this.addViewToParent(this.getParent<ClonableNode>());
    }
}

