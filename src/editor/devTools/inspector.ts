import { mouseDrag } from '../ui/components/dragger';
import Canvas2DPainter from './2dPainter';
import { type Cell, type CellStyle, type Column, type Row, createTable, renderTable } from './tableRenderer';

export abstract class DevInspector<T extends Record<string, any> >
{
    public id: string;
    public painter: Canvas2DPainter;
    public container: HTMLDivElement;

    protected isExpanded: boolean;

    constructor(id: string, backgroundColor = 'blue')
    {
        this.id = id;
        this.painter = new Canvas2DPainter(0, 0, backgroundColor);
        this.isExpanded = true;

        const canvas = this.painter.canvas;

        canvas.style.cssText = `
            border: 1px outset #666;
        `;

        const container = this.container = document.createElement('div');

        container.style.cssText = `
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 0;
            left: 0;
            z-index: 100000;
            cursor: move;
            box-shadow: 5px 5px 13px 1px rgba(0,0,0,0.3);
            box-sizing: border-box;
            user-select: none;
            display: none;
        `;

        container.innerHTML = `<label><span>${this.id}</span><div>+</div></label>`;

        const label = container.querySelector('label') as HTMLLabelElement;
        const button = container.querySelector('div') as HTMLDivElement;

        label.style.cssText = `
            display: flex;
            cursor: inherit;
            background-color: #333;
            color: white;
            font-size: 12px;
            text-align: center;
            font-weight: bold;
            background: linear-gradient(180deg, #333 0, #000000 100%);
            justify-content: space-between;
            padding: 3px;
            height: 25px;
        `;

        button.style.cssText = `
            width: 16px;
            height: 16px;
            cursor: pointer;
        `;

        container.appendChild(canvas);

        const localStorageKey = `comet:devtool:inspector:${id}`;

        const data = localStorage.getItem(localStorageKey);

        if (data)
        {
            const { x, y } = JSON.parse(data);

            container.style.left = `${x}px`;
            container.style.top = `${y}px`;
        }

        container.onmousedown = (e: MouseEvent) =>
        {
            const startX = container.offsetLeft;
            const startY = container.offsetTop;

            mouseDrag(e, (deltaX: number, deltaY: number) =>
            {
                container.style.left = `${startX + deltaX}px`;
                container.style.top = `${startY + deltaY}px`;
            }).then(() =>
            {
                localStorage.setItem(localStorageKey, JSON.stringify({
                    x: container.offsetLeft,
                    y: container.offsetTop,
                }));
            });
        };

        label.onclick = (e: MouseEvent) =>
        {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();

            return false;
        };

        button.onclick = (e: MouseEvent) =>
        {
            console.log(e.target, e.currentTarget);
            this.isExpanded = !this.isExpanded;
            this.updateExpandedState();
        };

        setInterval(() =>
        {
            this.update();
        }, 250);
    }

    protected abstract getDetails(): Record<string, T> | T[];

    protected update()
    {
        const details = this.getDetails();

        const table = createTable(details, this.painter.font.size);

        renderTable(table, this.painter, this.onCellStyle);

        this.container.style.display = 'flex';
    }

    protected updateExpandedState()
    {
        this.painter.canvas.style.display = this.isExpanded ? 'block' : 'none';
    }

    public abstract onCellStyle(row: Row, column: Column, cellStyle: CellStyle): void;

    public mount(container: HTMLElement)
    {
        container.appendChild(this.container);
    }

    protected getCell(columnId: string, row: Row)
    {
        return row.get(columnId) as Cell;
    }
}
