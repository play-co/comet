import { Graphics, Sprite, Texture } from 'pixi.js';

import { ModelSchema } from '../../../model/schema';
import { delay } from '../../../util';
import type { TextureAsset } from '../meta/assets/textureAssetNode';
import { type ContainerModel, ContainerNode, containerSchema } from './containerNode';

export interface SpriteModel extends ContainerModel
{
    anchorX: number;
    anchorY: number;
    tint: number;
    textureAssetId: string | null;
}

export const spriteSchema = new ModelSchema<SpriteModel>({
    ...containerSchema.properties,
    anchorX: {
        defaultValue: 0,
        category: 'texture',
    },
    anchorY: {
        defaultValue: 0,
        category: 'texture',
    },
    tint: {
        defaultValue: 0xffffff,
        category: 'display',
    },
    textureAssetId: {
        defaultValue: null,
        category: 'texture',
    },
});

export class SpriteNode<M extends SpriteModel = SpriteModel, V extends Sprite = Sprite> extends ContainerNode<M, V>
{
    protected placeHolder?: Graphics;

    public nodeType()
    {
        return 'Sprite';
    }

    public modelSchema(): ModelSchema<M>
    {
        return spriteSchema as unknown as ModelSchema<M>;
    }

    public createView(): V
    {
        return new Sprite(Texture.WHITE) as V;
    }

    public updateView(): void
    {
        const { view, values: { anchorX, anchorY, tint, textureAssetId } } = this;

        super.updateView();

        view.anchor.x = anchorX;
        view.anchor.y = anchorY;
        view.tint = tint;

        if (textureAssetId !== null)
        {
            if (Cache.textures.has(textureAssetId))
            {
                // texture is loaded
                const textureAsset = Cache.textures.get(textureAssetId);

                if (textureAsset.isResourceReady)
                {
                    this.setTexture(textureAsset);
                }
                else
                {
                    // show a random gray texture at the correct size until texture is loaded
                    const placeHolder = this.placeHolder = new Graphics();

                    placeHolder.beginFill(0xffffff, 0.5);
                    placeHolder.drawRect(0, 0, textureAsset.properties.width, textureAsset.properties.height);

                    view.texture = Texture.EMPTY;
                    view.addChild(placeHolder);

                    textureAsset.getResource().then(() =>
                    {
                        delay(2000).then(() =>
                        {
                            this.setTexture(textureAsset);
                        });
                    });
                }
            }
            else
            {
                throw new Error(`Texture "${textureAssetId}" was not loaded correctly in cache`);
            }
        }
    }

    protected setTexture(textureAsset: TextureAsset)
    {
        const { id, properties, resource } = textureAsset;
        const { width, height, mipmap, multisample, resolution, scaleMode, wrapMode } = properties;
        const { view } = this;

        if (!resource)
        {
            throw new Error(`Texture "${id}" resource not available`);
        }

        const texture = Texture.from(resource, {
            height,
            width,
            mipmap,
            multisample,
            resolution,
            scaleMode,
            wrapMode,
        });

        view.texture = texture;

        if (this.placeHolder)
        {
            view.removeChild(this.placeHolder);
            delete this.placeHolder;
        }
    }

    public get width(): number
    {
        const { view, values: { textureAssetId } } = this;

        return textureAssetId ? Cache.textures.get(textureAssetId).properties.width : view.texture.width;
    }

    public get height(): number
    {
        const { view, values: { textureAssetId } } = this;

        return textureAssetId ? Cache.textures.get(textureAssetId).properties.height : view.texture.height;
    }
}

