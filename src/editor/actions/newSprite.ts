import Color from 'color';

import type { SpriteModel, SpriteNode } from '../../core/nodes/concrete/display/spriteNode';
import { createNodeSchema } from '../../core/nodes/schema';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';
import { Action } from '../core/action';
import { Application } from '../core/application';

export type NewSpriteOptions = {
    addToSelected?: boolean;
    model?: Partial<SpriteModel>;
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
        const selectedNode = app.selection.lastNode;

        let parentId = app.viewport.rootNode.id;

        if (selectedNode && actionOptions.addToSelected)
        {
            parentId = selectedNode.id;
        }

        const tint = Color.rgb(this.rnd255(), this.rnd255(), this.rnd255());

        tint.lighten(0.5);

        const nodeSchema = createNodeSchema('Sprite', {
            parent: parentId,
            model: {
                x: 10,
                y: 10,
                scaleX: 1,
                scaleY: 1,
                tint: tint.rgbNumber(),
                ...actionOptions.model,
            },
        });

        const { nodes } = app.undoStack.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as SpriteNode;

        app.selection.set(node.asClonableNode());

        return node;
    }
}
