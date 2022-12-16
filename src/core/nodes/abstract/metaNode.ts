import type { ModelBase } from '../../model/model';
import type { ModelSchema } from '../../model/schema';
import { type ClonableNodeModel, type NewNodeOptions, ClonableNode, clonableNodeSchema } from './clonableNode';

export type ProjectFolderName =
| 'Textures'
| 'Scenes'
| 'Prefabs';

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

    public isRootFolder(name?: ProjectFolderName)
    {
        if (this.parent && this.parent.nodeType() !== 'Project')
        {
            return false;
        }

        if (name)
        {
            return this.nodeType() === 'Folder' && this.model.getValue('name') === name;
        }

        return true;
    }

    public get rootFolder(): MetaNode
    {
        if (this.isRootFolder())
        {
            return this.cast<MetaNode>();
        }

        return this.walk<MetaNode, {node: MetaNode}>((node, options) =>
        {
            if (node.isRootFolder())
            {
                options.data.node = node;

                options.cancel = true;
            }
        }, {
            includeSelf: false,
            direction: 'up',
        }).node;
    }

    public isWithinRootFolder(name: ProjectFolderName)
    {
        return this.rootFolder.model.getValue('name') === name;
    }

    public getAllChildrenByType(ctor: Function)
    {
        return this.filterWalk<MetaNode>((node) => node.is(ctor) && !node.isCloaked);
    }
}

