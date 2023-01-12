import Color from 'color';

import { type SpriteModel, type SpriteNode, defaultSpriteHeight, defaultSpriteWidth } from '../../core/nodes/concrete/display/spriteNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type CreateChildCommandReturn, CreateChildCommand } from '../commands/createChild';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type NewSpriteOptions = {
    parentId?: string;
    model?: Partial<SpriteModel>;
};

export const defaultNewSpriteOptions: NewSpriteOptions = {
    model: {},
};

export class NewSpriteAction extends Action<NewSpriteOptions, SpriteNode>
{
    constructor()
    {
        super('newSprite', {
            hotkey: 'Ctrl+N',
        });
    }

    public shouldRun(): boolean
    {
        const app = getApp();

        return super.shouldRun() && app.isAreaFocussed('viewport', 'hierarchy');
    }

    protected rnd255()
    {
        return Math.random() * 255;
    }

    protected exec(options?: Partial<NewSpriteOptions>): SpriteNode
    {
        const actionOptions = {
            ...defaultNewSpriteOptions,
            ...options,
        };
        const app = Application.instance;
        const { selection: { hierarchy: selection } } = app;
        const visibleBounds = app.view.getVisibleBounds();
        const x = visibleBounds.left + (visibleBounds.width / 2) - (defaultSpriteWidth / 2);
        const y = visibleBounds.top + (visibleBounds.height / 2) - (defaultSpriteHeight / 2);

        const parentId = actionOptions.parentId ?? (selection.hasSelection ? selection.lastItem.id : app.view.rootNode.id);

        const tint = Color.rgb(this.rnd255(), this.rnd255(), this.rnd255());

        tint.lighten(0.5);

        const model: any = {
            x,
            y,
            tint: tint.rgbNumber(),
            ...actionOptions.model,
        };

        const nodeSchema = createNodeSchema('Sprite', {
            parent: parentId,
            model,
        });

        const { nodes } = app.undoStack.exec<CreateChildCommandReturn>(new CreateChildCommand({ parentId, nodeSchema }));

        const node = nodes.find((node) => node.parent?.id === parentId);

        if (!node)
        {
            throw new Error('Failed to create sprite node');
        }

        app.selection.hierarchy.set(node.asClonableNode());

        return node.cast<SpriteNode>();
    }
}
