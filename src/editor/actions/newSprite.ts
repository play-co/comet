import Color from 'color';

import type { ContainerNode } from '../../core/nodes/concrete/container';
import type { SpriteModel, SpriteNode } from '../../core/nodes/concrete/sprite';
import { createNodeSchema } from '../../core/nodes/schema';
import { Application } from '../core/application';
import { type AddChildCommandReturn, AddChildCommand } from '../commands/addChild';
import { Action } from '../core/action';

export type NewSpriteOptions = {
    addToSelected?: boolean;
    model?: Partial<SpriteModel>;
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

    protected exec(options: NewSpriteOptions = {
        model: {},
        addToSelected: true,
    }): SpriteNode
    {
        const app = Application.instance;
        const selectedNode = app.selection.lastNode;

        let parentId = 'Scene:1';

        if (selectedNode && options.addToSelected)
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
                ...options.model,
            },
        });

        const { nodes } = app.undoStack.exec<AddChildCommandReturn>(new AddChildCommand({ parentId, nodeSchema }));

        const node = nodes[0] as unknown as SpriteNode;

        app.selection.set(node.cast<ContainerNode>());

        return node;
    }
}
