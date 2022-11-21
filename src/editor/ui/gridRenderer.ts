import Color from 'color';
import { Texture, TilingSprite } from 'pixi.js';

const large = 1;
const medium = 1;
const small = 0.5;

const light = 0.2;
const inBetween = 0.4;
const dark = 0.6;

const px = (num: number) => num + 0.5;

export default class Grid
{
    public canvas: HTMLCanvasElement;
    public width: number;
    public height: number;

    constructor(width = 100, height = 100)
    {
        const canvas = document.createElement('canvas');

        this.canvas = canvas;
        this.width = canvas.width = width;
        this.height = canvas.height = height;
        this.render();
    }

    public static createTilingSprite(width: number, height: number)
    {
        const grid = new Grid();

        return new TilingSprite(Texture.from(grid.canvas), width, height);
    }

    private render()
    {
        const { canvas, width, height } = this;
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, width, height);

        for (let y = 0; y <= height; y += 10)
        {
            ctx.strokeStyle = this.lineColor(y);
            ctx.lineWidth = this.lineWidth(y);

            ctx.beginPath();
            ctx.moveTo(px(0), px(y));
            ctx.lineTo(px(width), px(y));
            ctx.stroke();
            ctx.closePath();

            for (let x = 0; x <= width; x += 10)
            {
                ctx.strokeStyle = this.lineColor(x);
                ctx.lineWidth = this.lineWidth(x);

                ctx.beginPath();
                ctx.moveTo(px(x), px(0));
                ctx.lineTo(px(x), px(height));
                ctx.stroke();
                ctx.closePath();
            }
        }
    }

    private lineWidth(num: number)
    {
        // eslint-disable-next-line no-nested-ternary
        return num % 100 === 0 ? large : num % 50 === 0 ? medium : small;
    }

    private lineColor(num: number)
    {
        const green = Color('green');
        // eslint-disable-next-line no-nested-ternary
        const alpha = num % 100 === 0 ? light : num % 50 === 0 ? inBetween : dark;

        return green.darken(alpha).hex();
    }
}
