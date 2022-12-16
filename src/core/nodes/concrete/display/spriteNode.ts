import { Graphics, Sprite, Texture } from 'pixi.js';

import { Application } from '../../../../editor/core/application';
import { ModelSchema } from '../../../model/schema';
// import { delay } from '../../../util';
import type { TextureAssetNode } from '../meta/assets/textureAssetNode';
import { type ContainerModel, ContainerNode, containerSchema } from './containerNode';

export const defaultSpriteWidth = 16;
export const defaultSpriteHeight = 16;

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
    protected textureAssetId?: string;

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
        const { view, values: { anchorX, anchorY, tint } } = this;

        super.updateView();

        view.anchor.x = anchorX;
        view.anchor.y = anchorY;
        view.tint = tint;

        const textureAsset = this.getTextureAsset();

        if (textureAsset)
        {
            // texture is loaded
            if (textureAsset.isResourceReady)
            {
                this.setTexture(textureAsset);
            }
            else
            {
                // show a random gray texture at the correct size until texture is loaded
                const placeHolder = this.placeHolder = new Graphics();
                const width = textureAsset.model.width;
                const height = textureAsset.model.height;

                placeHolder.beginFill(0xffffff, 0.5);
                placeHolder.drawRect(0, 0, width, height);

                view.texture = Texture.EMPTY;
                view.addChild(placeHolder);

                textureAsset.getResource().then(() => this.setTexture(textureAsset));
            }
        }
        else if (this.textureAssetId)
        {
            this.clearTexture();
        }
    }

    protected getTextureAsset()
    {
        const { values: { textureAssetId } } = this;

        if (textureAssetId)
        {
            const asset = Application.instance.project.findAssetById(textureAssetId);

            if (asset)
            {
                return asset.cast<TextureAssetNode>();
            }
        }

        return undefined;
    }

    protected setTexture(textureAsset: TextureAssetNode)
    {
        const { id, resource } = textureAsset;
        const { width, height, mipmap, multisample, resolution, scaleMode, wrapMode } = textureAsset.model;
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
        this.textureAssetId = id;

        this.clearPlaceHolder();
    }

    protected clearPlaceHolder()
    {
        if (this.placeHolder)
        {
            this.view.removeChild(this.placeHolder);
            delete this.placeHolder;
        }
    }

    protected clearTexture()
    {
        this.view.texture.destroy(true);

        if (this.parent)
        {
            this.removeViewFromParent(this.parent.cast());
        }

        delete this.textureAssetId;

        this.clearPlaceHolder();
        this.resetView();
    }

    public get width(): number
    {
        const { view } = this;

        const textureAsset = this.getTextureAsset();

        return textureAsset ? textureAsset.model.width : view.texture.width;
    }

    public get height(): number
    {
        const { view } = this;

        const textureAsset = this.getTextureAsset();

        return textureAsset ? textureAsset.model.height : view.texture.height;
    }
}

