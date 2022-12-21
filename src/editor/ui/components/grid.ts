import Color from 'color';
import { Container, Graphics, Rectangle } from 'pixi.js';

import { Application } from '../../core/application';
import { snapToIncrement } from './../transform/util';

export interface GridConfig
{
    style: {
        color: Color;
        origin: Color;
    };
    scale: number;
    x: number;
    y: number;
}

export const defaultGridConfig: GridConfig = {
    style: {
        color: Color('darkgreen'),
        origin: Color('green'),
    },
    scale: 1,
    x: 0,
    y: 0,
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

    get gridSettings()
    {
        return Application.instance.gridSettings;
    }

    public setConfig(config: Partial<GridConfig>)
    {
        this.config = {
            ...this.config,
            ...config,
        };

        this.renderGrid();
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
        const { screenWidth, screenHeight, container: { worldTransform }, gridSettings: { smallUnit } } = this;
        const p1 = worldTransform.applyInverse({ x: 0, y: 0 });
        const p2 = worldTransform.applyInverse({ x: screenWidth, y: screenHeight });

        const x = snapToIncrement(p1.x, smallUnit) - smallUnit;
        const y = snapToIncrement(p1.y, smallUnit) - smallUnit;
        const width = snapToIncrement(p2.x - p1.x, smallUnit) + (smallUnit * 2);
        const height = snapToIncrement(p2.y - p1.y, smallUnit) + (smallUnit * 2);

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

    public renderGrid()
    {
        const { x, y, scale } = this.config;

        this.container.x = x;
        this.container.y = y;
        this.container.scale.set(scale);

        this.clear();

        this.renderHorizontalLines();
        this.renderVerticalLines();
        this.renderOrigin();
    }

    protected renderHorizontalLines()
    {
        const { globalOrigin, localScreenRect, gridSettings: { smallUnit }, screenWidth, config: { style: { color } } } = this;
        // const smallUnitScreenSize = this.getGlobalUnitSize(smallUnit);
        // const isTiny = smallUnitScreenSize < smallUnit * 0.75;
        // const unit = isTiny ? mediumUnit : smallUnit;
        const unit = smallUnit;

        if (globalOrigin.x > 0)
        {
            // draw from min to origin
            for (let i = localScreenRect.left; i <= 0; i += unit)
            {
                const p1 = this.localToGlobal({ x: i, y: localScreenRect.top });
                const p2 = this.localToGlobal({ x: i, y: localScreenRect.bottom });

                this.lineStyle(1, this.lineColor(color, i), 1);
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

                this.lineStyle(1, this.lineColor(color, i), 1);
                this.moveTo(p1.x, p1.y);
                this.lineTo(p2.x, p2.y);
            }
        }
    }

    protected renderVerticalLines()
    {
        const { globalOrigin, localScreenRect, gridSettings: { smallUnit }, screenHeight, config: { style: { color } } } = this;
        const unit = smallUnit;

        if (globalOrigin.y > 0)
        {
            // draw from min to origin
            for (let i = localScreenRect.top; i <= 0; i += unit)
            {
                const p1 = this.localToGlobal({ x: localScreenRect.left, y: i });
                const p2 = this.localToGlobal({ x: localScreenRect.right, y: i });

                this.lineStyle(1, this.lineColor(color, i), 1);
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

                this.lineStyle(1, this.lineColor(color, i), 1);
                this.moveTo(p1.x, p1.y);
                this.lineTo(p2.x, p2.y);
            }
        }
    }

    protected renderOrigin()
    {
        const { localScreenRect, globalOrigin, config: { style: { origin } } } = this;
        const p1 = this.localToGlobal({ x: localScreenRect.left, y: localScreenRect.top });
        const p2 = this.localToGlobal({ x: localScreenRect.right, y: localScreenRect.bottom });

        this.lineStyle(1, origin.rgbNumber(), 1);
        this.moveTo(globalOrigin.x, p1.y);
        this.lineTo(globalOrigin.x, p2.y);
        this.moveTo(p1.x, globalOrigin.y);
        this.lineTo(p2.x, globalOrigin.y);
    }

    private lineColor(color: Color, num: number)
    {
        const { mediumUnit, bigUnit } = this.gridSettings;
        // eslint-disable-next-line no-nested-ternary
        const alpha = num % bigUnit === 0 ? light : num % mediumUnit === 0 ? inBetween : dark;

        return color.darken(alpha).rgbNumber();
    }

    // private lightLine(color: Color)
    // {
    //     return color.darken(light).rgbNumber();
    // }

    // private inBetweenLine(color: Color)
    // {
    //     return color.darken(inBetween).rgbNumber();
    // }

    // private darkLine(color: Color)
    // {
    //     return color.darken(dark).rgbNumber();
    // }
}
