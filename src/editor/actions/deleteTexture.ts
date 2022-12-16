import type { ClonableNode } from '../../core';
import { SpriteNode } from '../../core/nodes/concrete/display/spriteNode';
import type { TextureAssetNode } from '../../core/nodes/concrete/meta/assets/textureAssetNode';
import { RemoveNodesCommand } from '../commands/removeNodes';
import { Action } from '../core/action';
import { getApp } from '../core/application';

export type DeleteTextureOptions = {
    nodeId: string;
};

export class DeleteTextureAction extends Action<DeleteTextureOptions, void>
{
    constructor()
    {
        super('DeleteTexture');
    }

    protected shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('project');
    }

    protected exec(options: DeleteTextureOptions): void
    {
        const { nodeId } = options;
        const app = getApp();
        const textureAssetId = nodeId;
        const usages = app.project.walk<ClonableNode, ClonableNode[]>((node, options) =>
        {
            if (node.is(SpriteNode))
            {
                const sprite = node.cast<SpriteNode>();

                if (sprite.model.getValue<string>('textureAssetId') === textureAssetId)
                {
                    options.data.push(node);
                }
            }
        }, {
            includeSelf: false,
            data: [],
        });

        usages.forEach((sprite) =>
        {
            console.log(sprite.id);
        });
    }
}
