import Color from 'color';
import { Graphics } from 'pixi.js';

export interface GridConfig
{
    scale: number;
    x: number;
    y: number;
    bigUnit: number;
    mediumUnit: number;
    smallUnit: number;
}

export const defaultGridConfig: GridConfig = {
    scale: 1,
    x: 0,
    y: 0,
    bigUnit: 100,
    mediumUnit: 50,
    smallUnit: 50,
};

const large = 1;
const medium = 1;
const small = 0.5;

const light = 0.2;
const inBetween = 0.4;
const dark = 0.6;

const px = (num: number) => num + 0.5;

export class Grid extends Graphics
{
    public config: GridConfig;

    constructor(config: Partial<GridConfig> = {})
    {
        super();

        this.config = {
            ...defaultGridConfig,
            ...config,
        };

        this.draw();
    }

    public setConfig(config: Partial<GridConfig>)
    {
        this.config = {
            ...this.config,
            ...config,
        };

        this.draw();
    }

    public draw()
    {
        const { bigUnit, smallUnit, scale, x, y } = this.config;
        const size = bigUnit * scale;

        this.x = x;
        this.y = y;

        console.log(this.worldTransform.apply({ x: 0, y: 0 }));

        this.clear();

        for (let y = 0; y <= size; y += smallUnit * scale)
        {
            this.lineStyle(this.lineWidth(y), this.lineColor(y), 1);

            this.moveTo(px(0), px(y));
            this.lineTo(px(size), px(y));

            for (let x = 0; x <= size; x += smallUnit * scale)
            {
                this.lineStyle(this.lineWidth(x), this.lineColor(x), 1);

                this.moveTo(px(x), px(0));
                this.lineTo(px(x), px(size));
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

        return green.darken(alpha).rgbNumber();
    }
}
