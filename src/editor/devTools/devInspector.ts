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
    public label: HTMLSpanElement;
    public maxHeight: number;
    public scrollTop: number;
    public zIndex: number;

    protected isExpanded: boolean;

    constructor(id: string, backgroundColor = 'blue')
    {
        this.id = id;
        this.painter = new Canvas2DPainter(0, 0, backgroundColor);
        this.isExpanded = true;
        this.maxHeight = -1;
        this.scrollTop = 0;
        this.zIndex = 100000;

        const canvas = this.painter.canvas;

        const container = this.container = document.createElement('div');

        container.setAttribute('class', 'dev-inspector');

        container.innerHTML = `
            <label>
                <span>${this.id}</span>
                <div class="inspect"><a title="Inspect (Shift-click to clear console)">?</a></div>
                <div class="toggle"><a title="Expand/Collapse">+</a></div>
            </label>
            `;

        const label = container.querySelector('label') as HTMLLabelElement;
        const inspectButton = container.querySelector('.inspect') as HTMLDivElement;
        const toggleButton = container.querySelector('.toggle') as HTMLDivElement;

        this.label = label.querySelector('span') as HTMLSpanElement;

        label.style.height = `${titleBarHeight}px`;

        container.appendChild(canvas);

        const scrollVTrack = this.scrollVTrack = document.createElement('div');
        const scrollVBox = this.scrollVBox = document.createElement('div');

        scrollVTrack.setAttribute('class', 'scroll-v-track');
        scrollVBox.setAttribute('class', 'scroll-v-box');

        this.table = this.createTable();

        scrollVTrack.style.cssText = `
            top: ${titleBarHeight + this.table.rowHeight}px;
            width: ${scrollBoxTrackSize}px;
        `;

        scrollVBox.style.cssText = `
            background-color: ${Color(this.painter.backgroundColor).lighten(0.5)};
            width: ${scrollBoxTrackSize}px;
            height: ${scrollBoxThumbSize}px;
        `;

        container.appendChild(scrollVTrack);

        scrollVTrack.appendChild(scrollVBox);

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

            this.zIndex++;

            container.style.zIndex = `${this.zIndex}`;

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

            const yInc = deltaY !== 0 ? 1 : 0;
            const st = deltaY < 0 ? scrollTop - yInc : scrollTop + yInc;

            this.setScrollTop(st);
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

                this.setScrollTop(Math.round(this.table.rows.length * t));
            });
        };

        setTimeout(() => this.init(), 0);
    }

    get localStorageKey()
    {
        return `comet:${user}:devtool:inspector:${this.id}`;
    }

    protected init()
    {
        // for subclasses...
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

    public setScrollTop(scrollTop: number)
    {
        const { table, painter: { canvas } } = this;
        const maxScrollTop = (table.rows.length) - Math.round((canvas.offsetHeight - table.rowHeight) / table.rowHeight);

        this.scrollTop = Math.max(0, Math.min(maxScrollTop, scrollTop));

        this.render();

        return this;
    }

    get maxScrollTop()
    {
        const { table, painter: { canvas } } = this;

        if (canvas.offsetHeight >= table.height || table.rows.length === 0)
        {
            return 0;
        }

        const diffSpace = (table.height - table.rowHeight) - (canvas.offsetHeight - titleBarHeight - table.rowHeight);

        return Math.floor(diffSpace / table.rowHeight);
    }

    public scrollToEnd()
    {
        this.scrollTop = this.maxScrollTop;

        this.render();
    }

    protected createTable()
    {
        const details = this.getDetails();

        return createTable(details, this.indexColumnLabel(), this.painter.font.size);
    }

    protected render()
    {
        const table = this.table = this.createTable();

        if (table.rows.length === 0)
        {
            this.painter.size(0, 0);
        }
        else
        {
            if (this.isExpanded)
            {
                const { maxHeight } = this;

                const height = maxHeight === -1
                    ? table.height
                    : Math.min(table.height, maxHeight + titleBarHeight + scrollBoxTrackSize);

                renderTable(table, this.painter, this.onCellStyle, table.width, height, 0, this.scrollTop);

                this.label.innerHTML = `${this.id} (${this.table.rows.length})`;
            }

            this.updateScrollBars();
        }
    }

    protected updateScrollBars()
    {
        const {
            container, scrollVTrack, scrollVBox, scrollTop, painter, table,
            painter: { canvas }, isExpanded,
        } = this;
        const maxScrollTop = (table.rows.length) - Math.round((canvas.offsetHeight - table.rowHeight) / table.rowHeight);

        container.style.display = 'flex';

        const h = scrollVTrack.offsetHeight;

        const top = (h - scrollBoxThumbSize) * (scrollTop / (maxScrollTop));

        const isVScrollHidden = painter.canvas.offsetHeight >= table.height || table.rows.length === 0 || !isExpanded;

        scrollVTrack.style.display = isVScrollHidden ? 'none' : 'block';
        scrollVBox.style.top = `${top}px`;
    }

    protected updateExpandedState()
    {
        const { scrollVTrack } = this;

        scrollVTrack.style.display = this.isExpanded ? 'block' : 'none';

        this.painter.canvas.style.display = this.isExpanded ? 'block' : 'none';

        this.render();
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
