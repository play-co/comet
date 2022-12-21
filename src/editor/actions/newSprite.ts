import Color from 'color';

import { type SpriteModel, type SpriteNode, defaultSpriteHeight, defaultSpriteWidth } from '../../core/nodes/concrete/display/spriteNode';
import { type CloneInfoSchema, createNodeSchema } from '../../core/nodes/schema';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';
import { Action } from '../core/action';
import { Application, getApp } from '../core/application';

export type NewSpriteOptions = {
    addToSelected?: boolean;
    parentId?: string;
    model?: Partial<SpriteModel>;
    cloneInfo?: CloneInfoSchema;
};

export const defaultNewSpriteOptions: NewSpriteOptions = {
    model: {},
    addToSelected: true,
};

export class NewSpriteAction extends Action<NewSpriteOptions, SpriteNode>
{
    constructor()
    {
        super('newSprite', {
            hotkey: 'Ctrl+N',
        });
    }

    protected shouldRun(): boolean
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
        const visibleBounds = app.viewport.getVisibleBounds();
        let x = visibleBounds.left + (visibleBounds.width / 2) - (defaultSpriteWidth / 2);
        let y = visibleBounds.top + (visibleBounds.height / 2) - (defaultSpriteHeight / 2);

        let parentId = app.viewport.rootNode.id;

        if (actionOptions.parentId)
        {
            parentId = actionOptions.parentId;
        }
        else if (actionOptions.addToSelected && selection.hasSelection)
        {
            parentId = selection.lastNode.id;
            x = 10;
            y = 10;
        }

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
            cloneInfo: actionOptions.cloneInfo,
            model,
        });

        const { nodes } = app.undoStack.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as SpriteNode;

        app.selection.hierarchy.set(node.asClonableNode());

        return node;
    }
}
