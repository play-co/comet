import { getUserName } from '../sync/user';
import { mouseDrag } from '../ui/components/dragger';
import Canvas2DPainter from './2dPainter';
import { type Cell, type CellStyle, type Column, type Row, type Table, createTable, renderTable } from './tableRenderer';

const user = getUserName();

export abstract class DevInspector<T extends Record<string, any> >
{
    public id: string;
    public painter: Canvas2DPainter;
    public table: Table;
    public container: HTMLDivElement;
    public scrollOuterDiv: HTMLDivElement;
    public scrollInnerDiv: HTMLDivElement;
    public width: number;
    public height: number;
    public scrollTop: number;

    protected isExpanded: boolean;

    constructor(id: string, backgroundColor = 'blue')
    {
        this.id = id;
        this.painter = new Canvas2DPainter(0, 0, backgroundColor);
        this.isExpanded = true;
        this.width = -1;
        this.height = -1;
        this.scrollTop = 0;

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

        container.innerHTML = `
        <label>
            <span>${this.id}</span>
            <div class="inspect"><a title="Inspect (Shift-click to clear console)">?</a></div>
            <div class="toggle"><a title="Expand/Collapse">+</a></div>
        </label>
        `;

        const label = container.querySelector('label') as HTMLLabelElement;
        const span = container.querySelector('span') as HTMLSpanElement;
        const inspectButton = container.querySelector('.inspect') as HTMLDivElement;
        const toggleButton = container.querySelector('.toggle') as HTMLDivElement;

        const titleBarHeight = 25;

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
            padding: 0 5px;
            height: ${titleBarHeight}px;
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

        const scrollOuterDiv = this.scrollOuterDiv = document.createElement('div');
        const scrollInnerDiv = this.scrollInnerDiv = document.createElement('div');

        this.table = this.update();

        scrollOuterDiv.style.cssText = `
            opacity: 0.5;
            position: absolute;
            top: ${titleBarHeight + this.table.rowHeight}px;
            left: 0;
            right: 0;
            bottom: 0;
            /*overflow-y: auto;*/
            overflow-y: auto;
        `;

        scrollInnerDiv.style.cssText = `
            background-color: red;
            opacity: 0.5;
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            /*visibility: hidden;*/
            visibility: hidden;
        `;

        container.appendChild(scrollOuterDiv);
        scrollOuterDiv.appendChild(scrollInnerDiv);

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

        inspectButton.onclick = (e: MouseEvent) =>
        {
            if (e.shiftKey)
            {
                console.clear();
            }
            this.inspect();
        };

        scrollOuterDiv.onwheel = (e: WheelEvent) =>
        {
            const { deltaY } = e;
            const { scrollTop } = this;
            const inc = 1;
            const value = deltaY < 0 ? scrollTop - inc : scrollTop + inc;

            this.setScrollTop(value);
        };

        scrollOuterDiv.onscroll = () =>
        {
            // scrollOuterDiv.scrollTop = this.scrollTop * this.table.rowHeight * -1;
            console.log(scrollOuterDiv.scrollTop);
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

    public setSize(width: number, height: number)
    {
        this.width = width;
        this.height = height;
        this.update();

        return this;
    }

    public setWidth(width: number)
    {
        this.width = width;
        this.update();

        return this;
    }

    public setHeight(height: number)
    {
        this.height = height;
        this.update();

        return this;
    }

    public setScrollTop(scrollTop: number)
    {
        this.scrollTop = Math.max(0, Math.min(this.table.rows.length - 1, scrollTop));
        this.update();

        return this;
    }

    protected update()
    {
        const { container, scrollInnerDiv: scrollDiv, scrollTop } = this;
        const details = this.getDetails();

        const table = this.table = createTable(details, this.indexColumnLabel(), this.painter.font.size);

        if (table.rows.length === 0)
        {
            this.painter.size(0, 0);
        }
        else
        {
            renderTable(table, this.painter, this.onCellStyle, this.width, this.height, this.scrollTop);
        }

        container.style.display = 'flex';

        scrollDiv.style.top = `${scrollTop * table.rowHeight * -1}px`;
        scrollDiv.style.width = `${table.width - 30}px`;
        scrollDiv.style.height = `${table.height - table.rowHeight}px`;

        return table;
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
