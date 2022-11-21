import Color from 'color';
import { Container, Graphics, Rectangle } from 'pixi.js';

import { snapToIncrement } from './transform/util';

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
    smallUnit: 10,
};

const light = 0.1;
const inBetween = 0.4;
const dark = 0.7;

export class Grid extends Graphics
{
    public canvas: HTMLCanvasElement;
    public config: GridConfig;
    public container: Container;

    constructor(canvas: HTMLCanvasElement, config: Partial<GridConfig> = {})
    {
        super();

        this.canvas = canvas;
        this.config = {
            ...defaultGridConfig,
            ...config,
        };
        this.container = new Container();
        this.addChild(this.container);
    }

    public setConfig(config: Partial<GridConfig>)
    {
        this.config = {
            ...this.config,
            ...config,
        };

        this.draw();
    }

    protected get screenWidth()
    {
        return this.canvas.offsetWidth;
    }

    protected get screenHeight()
    {
        return this.canvas.offsetHeight;
    }

    protected get globalOrigin()
    {
        return this.container.worldTransform.apply({ x: 0, y: 0 });
    }

    protected get localScreenRect()
    {
        const { screenWidth, screenHeight, container: { worldTransform }, config: { smallUnit } } = this;
        const p1 = worldTransform.applyInverse({ x: 0, y: 0 });
        const p2 = worldTransform.applyInverse({ x: screenWidth, y: screenHeight });

        const x = snapToIncrement(p1.x, smallUnit);
        const y = snapToIncrement(p1.y, smallUnit);
        const width = snapToIncrement(p2.x - p1.x, smallUnit);
        const height = snapToIncrement(p2.y - p1.y, smallUnit);

        return new Rectangle(x, y, width, height);
    }

    protected getGlobalUnitSize(localUnit: number)
    {
        const { container: { worldTransform } } = this;
        const p1 = worldTransform.apply({ x: 0, y: 0 });
        const p2 = worldTransform.apply({ x: localUnit, y: 0 });

        return p2.x - p1.x;
    }

    protected localToGlobal(p: {x: number; y: number})
    {
        return this.container.worldTransform.apply(p);
    }

    public draw()
    {
        const { x, y, scale } = this.config;

        this.container.x = x;
        this.container.y = y;
        this.container.scale.set(scale);

        this.clear();

        this.drawHorizontal();
        this.drawVertical();
        this.drawOrigin();
    }

    protected drawHorizontal()
    {
        const { globalOrigin, localScreenRect, config: { smallUnit }, screenWidth } = this;
        const green = Color('green');
        const unit = smallUnit;

        if (globalOrigin.x > 0)
        {
            // draw from min to origin
            for (let i = localScreenRect.left; i <= 0; i += unit)
            {
                const p1 = this.localToGlobal({ x: i, y: localScreenRect.top });
                const p2 = this.localToGlobal({ x: i, y: localScreenRect.bottom });

                this.lineStyle(1, this.lineColor(green, i), 1);
                this.moveTo(p1.x, p1.y);
                this.lineTo(p2.x, p2.y);
            }
        }

        if (globalOrigin.x < screenWidth)
        {
            // draw from origin to max
            for (let i = localScreenRect.right; i > 0; i -= unit)
            {
                const p1 = this.localToGlobal({ x: i, y: localScreenRect.top });
                const p2 = this.localToGlobal({ x: i, y: localScreenRect.bottom });

                this.lineStyle(1, this.lineColor(green, i), 1);
                this.moveTo(p1.x, p1.y);
                this.lineTo(p2.x, p2.y);
            }
        }
    }

    protected drawVertical()
    {
        const { globalOrigin, localScreenRect, config: { smallUnit }, screenHeight } = this;
        const green = Color('green');
        const unit = smallUnit;

        if (globalOrigin.y > 0)
        {
            // draw from min to origin
            for (let i = localScreenRect.top; i <= 0; i += unit)
            {
                const p1 = this.localToGlobal({ x: localScreenRect.left, y: i });
                const p2 = this.localToGlobal({ x: localScreenRect.right, y: i });

                this.lineStyle(1, this.lineColor(green, i), 1);
                this.moveTo(p1.x, p1.y);
                this.lineTo(p2.x, p2.y);
            }
        }

        if (globalOrigin.y < screenHeight)
        {
            // draw from origin to max
            for (let i = localScreenRect.bottom; i > 0; i -= unit)
            {
                const p1 = this.localToGlobal({ x: localScreenRect.left, y: i });
                const p2 = this.localToGlobal({ x: localScreenRect.right, y: i });

                this.lineStyle(1, this.lineColor(green, i), 1);
                this.moveTo(p1.x, p1.y);
                this.lineTo(p2.x, p2.y);
            }
        }
    }

    protected drawOrigin()
    {
        const { localScreenRect, globalOrigin } = this;
        const p1 = this.localToGlobal({ x: localScreenRect.left, y: localScreenRect.top });
        const p2 = this.localToGlobal({ x: localScreenRect.right, y: localScreenRect.bottom });
        const yellow = Color('lime');

        this.lineStyle(1, yellow.rgbNumber(), 1);
        this.moveTo(globalOrigin.x, p1.y);
        this.lineTo(globalOrigin.x, p2.y);
        this.moveTo(p1.x, globalOrigin.y);
        this.lineTo(p2.x, globalOrigin.y);
    }

    private lineColor(color: Color, num: number)
    {
        // eslint-disable-next-line no-nested-ternary
        const alpha = num % 100 === 0 ? light : num % 50 === 0 ? inBetween : dark;

        return color.darken(alpha).rgbNumber();
    }
}
