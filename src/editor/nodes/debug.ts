import { Sprite, Text, Texture } from 'pixi.js';

import { ModelSchema } from '../../core/model/schema';
import { type SpriteModel, SpriteNode, spriteSchema } from '../../core/nodes/concrete/sprite';

export interface DebugModel extends SpriteModel
{
    label: string;
}

export const schema = new ModelSchema<DebugModel>({
    ...spriteSchema.properties,
    label: {
        defaultValue: '',
        category: 'Text',
    },
}, {
    ...spriteSchema.constraints,
});

export class DebugNode extends SpriteNode<DebugModel, Sprite>
{
    public nodeType()
    {
        return 'Debug';
    }

    public modelSchema(): ModelSchema<DebugModel>
    {
        return schema;
    }

    public createView(): Sprite
    {
        const sprite = new Sprite(Texture.WHITE);
        const label = new Text(this.id.replace('Node', ''), {
            fontSize: 10,
            fill: 0xffffff,
        });

        label.x = 20;
        label.y = 3;

        sprite.addChild(label);

        return sprite;
    }

    public updateView(): void
    {
        super.updateView();

        const textLabel = this.view.getChildAt(0) as Text;

        const { label } = this.values;

        textLabel.text = `${this.id.replace('Node', '')}${label ? `=${label}` : ''}`;
    }
}
