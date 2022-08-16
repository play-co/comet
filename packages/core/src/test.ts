import { Sprite, Texture } from 'pixi.js';

import { degToRad } from './geom';

export class Test extends Sprite
{
    constructor()
    {
        super();
        this.texture = Texture.WHITE;
        this.width = 50;
        this.height = 50;
        this.tint = 0x00ff00;

        setInterval(() =>
        {
            this.rotation += degToRad(1);
        }, 16);
    }

    static get info()
    {
        return 'Test!!!23';
    }
}
