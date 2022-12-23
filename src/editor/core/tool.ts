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

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseDown(event: MouseEvent)
    {
        console.log('onMouseDown', event);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseMove(event: MouseEvent)
    {
        console.log('onMouseMove', event);
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onMouseUp(event: MouseEvent)
    {
        console.log('onMouseUp', event);
    }
}
