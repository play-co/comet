import type { InteractionEvent } from 'pixi.js';

// todo: consolidate with DragInfo interface (src/editor/ui/transform/operation.ts)
export interface ToolEvent
{
    originalEvent: InteractionEvent;
    globalX: number;
    globalY: number;
    localX: number;
    localY: number;
    alt: boolean;
    shift: boolean;
    ctrl: boolean;
    meta: boolean;
}

export interface ToolOptions
{
    icon: string;
    tip: string;
}

export class Tool
{
    public id: string;
    public options: ToolOptions;

    constructor(id: string, options: ToolOptions)
    {
        this.id = id;
        this.options = options;
    }

    public select()
    {
        // console.log('deselect', this.id);
    }

    public deselect()
    {
        // console.log('deselect', this.id);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public mouseDown(event: ToolEvent)
    {
        // console.log('onMouseDown', this.id);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public mouseMove(event: ToolEvent)
    {
        // console.log('onMouseMove', this.id);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public mouseUp()
    {
        // console.log('onMouseUp', this.id);
    }
}
