import Color from 'color';

import { getUserName } from '../sync/user';
import { mouseDrag } from '../ui/components/dragger';
import Canvas2DPainter from './2dPainter';
import { type Cell, type CellStyle, type Column, type Row, type Table, createTable, renderTable } from './tableRenderer';

const user = getUserName();

const scrollBoxWidth = 10;
const scrollBoxHeight = 15;
const titleBarHeight = 25;

export abstract class DevInspector<T extends Record<string, any> >
{
    public id: string;
    public painter: Canvas2DPainter;
    public table: Table;
    public container: HTMLDivElement;
    public scrollTrack: HTMLDivElement;
    public scrollBox: HTMLDivElement;
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

        const scrollTrack = this.scrollTrack = document.createElement('div');
        const scrollBox = this.scrollBox = document.createElement('div');

        this.table = this.update();

        scrollTrack.style.cssText = `
            position: absolute;
            top: ${titleBarHeight + this.table.rowHeight}px;
            right: 0;
            width: ${scrollBoxWidth}px;
            bottom: 0;
            background-color: rgba(0,0,0,0.3);
        `;

        scrollBox.style.cssText = `
            background-color: ${Color(this.painter.backgroundColor).darken(0.7)};
            opacity: 0.5;
            position: absolute;
            width: ${scrollBoxWidth}px;
            height: ${scrollBoxHeight}px;
            top: 0;
            right: 0;
            border: 1px outset #888;
        `;

        container.appendChild(scrollTrack);
        scrollTrack.appendChild(scrollBox);

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

        canvas.onwheel = (e: WheelEvent) =>
        {
            const { deltaY } = e;
            const { scrollTop } = this;
            const inc = 1;
            const value = deltaY < 0 ? scrollTop - inc : scrollTop + inc;

            this.setScrollTop(value);
        };

        scrollBox.onmousedown = (e) =>
        {
            const startY = parseFloat(scrollBox.style.top);
            const h = scrollTrack.offsetHeight - scrollBoxHeight;

            e.stopPropagation();

            mouseDrag(e, (_deltaX: number, deltaY: number) =>
            {
                const top = Math.max(0, Math.min(startY + deltaY, h));
                const t = top / h;

                this.setScrollTop(Math.round(this.table.rows.length * t));
            });
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
        const { container, scrollTrack, scrollBox, scrollTop, painter } = this;
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

        const t = scrollTop / (this.table.rows.length - 1);
        const h = scrollTrack.offsetHeight;
        const top = (h - scrollBoxHeight) * t;

        scrollTrack.style.display = painter.canvas.offsetHeight > table.height || table.rows.length === 0 ? 'none' : 'block';

        scrollBox.style.top = `${top}px`;

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
