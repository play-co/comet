import { getUserName } from '../sync/user';
import { mouseDrag } from '../ui/components/dragger';
import Canvas2DPainter from './2dPainter';
import { type Cell, type CellStyle, type Column, type Row, createTable, renderTable } from './tableRenderer';

const user = getUserName();

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

        container.innerHTML = `<label><span>${this.id}</span><div class="inspect">?</div><div class="toggle">+</div></label>`;

        const label = container.querySelector('label') as HTMLLabelElement;
        const span = container.querySelector('span') as HTMLSpanElement;
        const inspectButton = container.querySelector('.inspect') as HTMLDivElement;
        const toggleButton = container.querySelector('.toggle') as HTMLDivElement;

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

        span.style.cssText = `
            flex-grow: 1;
        `;

        inspectButton.style.cssText = `
            width: 16px;
            height: 16px;
            cursor: pointer;
        `;

        toggleButton.style.cssText = `
            width: 16px;
            height: 16px;
            cursor: pointer;
        `;

        container.appendChild(canvas);

        const localStorageKey = this.localStorageKey;

        const data = localStorage.getItem(localStorageKey);

        if (data)
        {
            const { x, y, isExpanded } = JSON.parse(data);

            container.style.left = `${x}px`;
            container.style.top = `${y}px`;
            this.isExpanded = isExpanded;

            this.updateExpandedState();
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
                this.storeState();
            });
        };

        label.onclick = (e: MouseEvent) =>
        {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();

            return false;
        };

        toggleButton.onclick = () =>
        {
            this.isExpanded = !this.isExpanded;
            this.storeState();
            this.updateExpandedState();
        };

        inspectButton.onclick = () =>
        {
            this.inspect();
        };

        setInterval(() =>
        {
            this.update();
        }, 250);
    }

    get localStorageKey()
    {
        return `comet:${user}:devtool:inspector:${this.id}`;
    }

    protected storeState()
    {
        const { container } = this;
        const localStorageKey = this.localStorageKey;

        localStorage.setItem(localStorageKey, JSON.stringify({
            x: container.offsetLeft,
            y: container.offsetTop,
            isExpanded: this.isExpanded,
        }));
    }

    protected abstract indexColumnLabel(): string;
    protected abstract getDetails(): Record<string, T> | T[];
    protected abstract inspect(): void;

    protected update()
    {
        const details = this.getDetails();

        const table = createTable(details, this.indexColumnLabel(), this.painter.font.size);

        if (table.rows.length === 0)
        {
            this.painter.size(0, 0);
        }
        else
        {
            renderTable(table, this.painter, this.onCellStyle);
        }

        this.container.style.display = 'flex';
    }

    protected updateExpandedState()
    {
        this.painter.canvas.style.display = this.isExpanded ? 'block' : 'none';
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onCellStyle = (row: Row, column: Column, cellStyle: CellStyle): void =>
    {
        //
    };

    public mount(container: HTMLElement)
    {
        container.appendChild(this.container);
    }

    protected getCell(columnId: string, row: Row)
    {
        return row.get(columnId) as Cell;
    }
}
