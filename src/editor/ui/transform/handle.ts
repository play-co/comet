import { SmoothGraphics as Graphics } from '@pixi/graphics-smooth';

export type HandleVertexHorizontal = 'none' | 'left' | 'center' | 'right';
export type HandleVertexVertical = 'none' | 'top' | 'center' | 'bottom';

export interface HandleVertex
{
    h: HandleVertexHorizontal;
    v: HandleVertexVertical;
}

export class TransformGizmoHandle extends Graphics
{
    public vertex: HandleVertex;

    constructor(size: number, vertex: HandleVertex)
    {
        super();

        this.interactive = true;

        this.lineStyle(1, 0x000000, 0.5);
        this.beginFill(0xffffff, 1);
        this.drawRect(0, 0, size, size);
        this.endFill();

        this.lineStyle(1, 0x000000, 0);
        this.beginFill(0x000000, 0.35);
        this.drawRect(2, 2, size - 2, size - 2);
        this.endFill();

        this.pivot.x = size * 0.5;
        this.pivot.y = size * 0.5;

        this.cursor = 'crosshair';

        this.vertex = vertex;
    }
}
