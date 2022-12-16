import type { ModelBase } from '../../model/model';
import type { ModelSchema } from '../../model/schema';
import { type ClonableNodeModel, type NewNodeOptions, ClonableNode, clonableNodeSchema } from './clonableNode';

export abstract class MetaNode<M extends ClonableNodeModel = ClonableNodeModel> extends ClonableNode<M, {}>
{
    constructor(
        options: NewNodeOptions<M> = {},
    )
    {
        super(options);
    }

    protected initView(): void
    {
        // bypass
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected addViewToParent(parent: ClonableNode): void
    {
        //
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected removeViewFromParent(parent: ClonableNode<ModelBase, object>): void
    {
        //
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public createView(): {}
    {
        //
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public updateView(): void
    {
        //
    }

    public get isMetaNode()
    {
        return true;
    }

    public modelSchema(): ModelSchema<M>
    {
        return clonableNodeSchema as unknown as ModelSchema<M>;
    }
}

