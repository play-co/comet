import Color from 'color';

import { getUserName } from '../sync/user';
import { mouseDrag } from '../ui/components/dragger';
import Canvas2DPainter from './2dPainter';
import { type Cell, type CellStyle, type Column, type Row, type Table, createTable, renderTable } from './tableRenderer';

const user = getUserName();

const scrollBoxTrackSize = 10;
const scrollBoxThumbSize = 15;
const titleBarHeight = 25;

export abstract class DevInspector<T extends Record<string, any> >
{
    public id: string;
    public painter: Canvas2DPainter;
    public table: Table;
    public container: HTMLDivElement;
    public scrollVTrack: HTMLDivElement;
    public scrollVBox: HTMLDivElement;
    public scrollHTrack: HTMLDivElement;
    public scrollHBox: HTMLDivElement;
    public resizeBox: HTMLDivElement;
    public width: number;
    public height: number;
    public scrollTop: number;
    public scrollLeft: number;

    protected isExpanded: boolean;

    constructor(id: string, backgroundColor = 'blue')
    {
        this.id = id;
        this.painter = new Canvas2DPainter(0, 0, backgroundColor);
        this.isExpanded = true;
        this.width = -1;
        this.height = -1;
        this.scrollTop = 0;
        this.scrollLeft = 0;

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

        const scrollVTrack = this.scrollVTrack = document.createElement('div');
        const scrollVBox = this.scrollVBox = document.createElement('div');
        const scrollHTrack = this.scrollHTrack = document.createElement('div');
        const scrollHBox = this.scrollHBox = document.createElement('div');
        const resizeBox = this.resizeBox = document.createElement('div');

        this.table = this.update();

        scrollVTrack.style.cssText = `
            position: absolute;
            top: ${titleBarHeight + this.table.rowHeight}px;
            right: 0;
            width: ${scrollBoxTrackSize}px;
            bottom: ${scrollBoxTrackSize}px;
            background-color: rgba(0,0,0,0.5);
            display: none;
        `;

        scrollVBox.style.cssText = `
            background-color: ${Color(this.painter.backgroundColor).lighten(0.5)};
            position: absolute;
            width: ${scrollBoxTrackSize}px;
            height: ${scrollBoxThumbSize}px;
            top: 0;
            right: 0;
            border: 1px outset #888;
        `;

        scrollHTrack.style.cssText = `
            position: absolute;
            left: 0;
            bottom: 0;
            right: ${scrollBoxTrackSize}px;
            height: ${scrollBoxTrackSize}px;
            background-color: rgba(0,0,0,0.5);
            display: none;
        `;

        scrollHBox.style.cssText = `
            background-color: ${Color(this.painter.backgroundColor).lighten(0.5)};
            position: absolute;
            height: ${scrollBoxTrackSize}px;
            width: ${scrollBoxThumbSize}px;
            top: 0;
            left: 0;
            border: 1px outset #888;
        `;

        resizeBox.style.cssText = `
            background-color: ${Color(this.painter.backgroundColor).lighten(0.15)};
            position: absolute;
            height: ${scrollBoxTrackSize}px;
            width: ${scrollBoxTrackSize}px;
            bottom: 0;
            right: 0;
            border: 1px outset #888;
        `;

        container.appendChild(scrollVTrack);
        container.appendChild(scrollHTrack);
        container.appendChild(resizeBox);

        scrollVTrack.appendChild(scrollVBox);
        scrollHTrack.appendChild(scrollHBox);

        const localStorageKey = this.localStorageKey;

        const data = localStorage.getItem(localStorageKey);

        if (data)
        {
            const { x, y, width, height, isExpanded } = JSON.parse(data);

            container.style.left = `${x}px`;
            container.style.top = `${y}px`;
            this.isExpanded = isExpanded;
            this.width = width;
            this.height = height;

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
            const { deltaX, deltaY } = e;
            const { scrollLeft, scrollTop } = this;

            const xInc = deltaX !== 0 ? 0.1 : 0;
            const yInc = deltaY !== 0 ? 1 : 0;
            const sl = deltaX > 0 ? scrollLeft - xInc : scrollLeft + xInc;
            const st = deltaY < 0 ? scrollTop - yInc : scrollTop + yInc;

            this.setScrollPos(sl, st);
        };

        scrollVBox.onmousedown = (e) =>
        {
            const startY = parseFloat(scrollVBox.style.top);
            const h = scrollVTrack.offsetHeight - scrollBoxThumbSize;

            e.stopPropagation();

            mouseDrag(e, (_deltaX: number, deltaY: number) =>
            {
                const top = Math.max(0, Math.min(startY + deltaY, h));
                const t = top / h;

                this.setScrollPos(this.scrollLeft, Math.round(this.table.rows.length * t));
            });
        };

        scrollHBox.onmousedown = (e) =>
        {
            const startX = parseFloat(scrollHBox.style.left);
            const w = scrollHTrack.offsetWidth - scrollBoxThumbSize;

            e.stopPropagation();

            mouseDrag(e, (deltaX: number) =>
            {
                const left = Math.max(0, Math.min(startX + deltaX, w));

                this.setScrollPos(left / w, this.scrollTop);
            });
        };

        resizeBox.onmousedown = (e) =>
        {
            const startWidth = this.width === -1 ? this.table.width : this.width;
            const startHeight = this.height === -1 ? this.table.height : this.height;

            e.stopPropagation();

            mouseDrag(e, (deltaX: number, deltaY: number) =>
            {
                this.setSize(startWidth + deltaX, startHeight + deltaY);
            }).then(() =>
            {
                this.storeState();
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
            width: this.width,
            height: this.height,
            isExpanded: this.isExpanded,
        }));
    }

    protected abstract indexColumnLabel(): string;
    protected abstract getDetails(): Record<string, T> | T[];
    protected abstract inspect(): void;

    public setSize(width: number, height: number)
    {
        this.width = Math.min(this.table.width, width);
        this.height = Math.min(this.table.height, height);

        if (this.width === this.table.width)
        {
            this.width = -1;
        }

        if (this.height === this.table.height)
        {
            this.height = -1;
        }

        this.update();

        return this;
    }

    public setWidth(width: number)
    {
        return this.setSize(width, this.height);
    }

    public setHeight(height: number)
    {
        return this.setSize(this.width, height);
    }

    public setScrollPos(scrollLeft: number, scrollTop: number)
    {
        this.scrollLeft = Math.max(0, Math.min(scrollLeft, 1));
        this.scrollTop = Math.max(0, Math.min(this.table.rows.length - 1, scrollTop));

        this.update();

        return this;
    }

    protected update()
    {
        const { container, scrollVTrack, scrollHTrack, scrollVBox, scrollHBox, scrollTop, scrollLeft, painter, resizeBox } = this;
        const details = this.getDetails();

        const table = this.table = createTable(details, this.indexColumnLabel(), this.painter.font.size);

        const hOverflow = Math.round(this.table.width - this.container.offsetWidth + scrollBoxTrackSize);

        if (table.rows.length === 0)
        {
            this.painter.size(0, 0);
        }
        else
        {
            renderTable(table, this.painter, this.onCellStyle, this.width, this.height, hOverflow * this.scrollLeft, this.scrollTop);
        }

        container.style.display = 'flex';

        const w = scrollHTrack.offsetWidth;
        const h = scrollVTrack.offsetHeight;

        const top = (h - scrollBoxThumbSize) * (scrollTop / (this.table.rows.length - 1));

        const left = (w - scrollBoxThumbSize) * scrollLeft;

        const isVScrollHidden = painter.canvas.offsetHeight >= table.height || table.rows.length === 0;
        const isHScrollHidden = Math.round(this.table.width - this.container.offsetWidth) === 0 || table.rows.length === 0;

        scrollVTrack.style.display = isVScrollHidden ? 'none' : 'block';
        scrollVBox.style.top = `${top}px`;

        scrollHTrack.style.display = isHScrollHidden ? 'none' : 'block';
        scrollHBox.style.left = `${left}px`;

        resizeBox.style.display = table.rows.length === 0 ? 'none' : 'block';

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
