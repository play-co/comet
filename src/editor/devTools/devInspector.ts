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
    public maxWidth: number;
    public maxHeight: number;
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
        this.maxWidth = -1;
        this.maxHeight = -1;
        this.scrollTop = 0;
        this.scrollLeft = 0;

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

        label.style.height = `${titleBarHeight}px`;

        container.appendChild(canvas);

        const scrollVTrack = this.scrollVTrack = document.createElement('div');
        const scrollVBox = this.scrollVBox = document.createElement('div');
        const scrollHTrack = this.scrollHTrack = document.createElement('div');
        const scrollHBox = this.scrollHBox = document.createElement('div');
        const resizeBox = this.resizeBox = document.createElement('div');

        scrollVTrack.setAttribute('class', 'scroll-v-track');
        scrollVBox.setAttribute('class', 'scroll-v-box');
        scrollHTrack.setAttribute('class', 'scroll-h-track');
        scrollHBox.setAttribute('class', 'scroll-h-box');
        resizeBox.setAttribute('class', 'resize-box');

        this.table = this.createTable();

        scrollVTrack.style.cssText = `
            top: ${titleBarHeight + this.table.rowHeight}px;
            width: ${scrollBoxTrackSize}px;
            bottom: ${scrollBoxTrackSize}px;
        `;

        scrollVBox.style.cssText = `
            background-color: ${Color(this.painter.backgroundColor).lighten(0.5)};
            width: ${scrollBoxTrackSize}px;
            height: ${scrollBoxThumbSize}px;
        `;

        scrollHTrack.style.cssText = `
            right: ${scrollBoxTrackSize}px;
            height: ${scrollBoxTrackSize}px;
        `;

        scrollHBox.style.cssText = `
            background-color: ${Color(this.painter.backgroundColor).lighten(0.5)};
            height: ${scrollBoxTrackSize}px;
            width: ${scrollBoxThumbSize}px;
        `;

        resizeBox.style.cssText = `
            background-color: ${Color(this.painter.backgroundColor).lighten(0.15)};
            height: ${scrollBoxTrackSize}px;
            width: ${scrollBoxTrackSize}px;
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

        setTimeout(() =>
        {
            this.init();
        }, 0);
    }

    get localStorageKey()
    {
        return `comet:${user}:devtool:inspector:${this.id}`;
    }

    protected init()
    {
        //
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

    public setMaxSize(width: number, height: number)
    {
        this.maxWidth = width;
        this.maxHeight = height;

        return this;
    }

    public setSize(width: number, height: number)
    {
        this.width = Math.min(width, Math.min(this.table.width, this.maxWidth === -1 ? Number.MAX_VALUE : this.maxWidth));
        this.height = Math.min(height, Math.min(this.table.height, this.maxHeight, height));

        this.update();

        return this;
    }

    public setScrollPos(scrollLeft: number, scrollTop: number)
    {
        const { table, painter: { canvas } } = this;
        const maxScrollTop = (table.rows.length) - Math.round((canvas.offsetHeight - table.rowHeight) / table.rowHeight);

        this.scrollLeft = Math.max(0, Math.min(scrollLeft, 1));
        this.scrollTop = Math.max(0, Math.min(maxScrollTop, scrollTop));

        this.update();

        return this;
    }

    get maxScrollTop()
    {
        const { table, painter: { canvas } } = this;

        if (canvas.offsetHeight >= table.height || table.rows.length === 0)
        {
            return 0;
        }

        const diffSpace = (table.height) - canvas.offsetHeight;

        return Math.floor(diffSpace / table.rowHeight);
    }

    public scrollToEnd()
    {
        this.scrollTop = this.maxScrollTop;
        this.update();
    }

    protected createTable()
    {
        const details = this.getDetails();

        return createTable(details, this.indexColumnLabel(), this.painter.font.size);
    }

    protected update()
    {
        const table = this.table = this.createTable();

        const hOverflow = Math.round(this.table.width - this.container.offsetWidth + scrollBoxTrackSize);

        if (table.rows.length === 0)
        {
            this.painter.size(0, 0);
        }
        else
        {
            if (this.isExpanded)
            {
                renderTable(table, this.painter, this.onCellStyle, this.width, this.height, hOverflow * this.scrollLeft, this.scrollTop);
            }
            this.updateScrollBars();
        }
    }

    protected updateScrollBars()
    {
        const {
            container, scrollVTrack, scrollHTrack, scrollVBox, scrollHBox, scrollTop, scrollLeft, painter, resizeBox, table,
            painter: { canvas }, isExpanded,
        } = this;
        const maxScrollTop = (table.rows.length) - Math.round((canvas.offsetHeight - table.rowHeight) / table.rowHeight);

        container.style.display = 'flex';

        const w = scrollHTrack.offsetWidth;
        const h = scrollVTrack.offsetHeight;

        const top = (h - scrollBoxThumbSize) * (scrollTop / (maxScrollTop));

        const left = (w - scrollBoxThumbSize) * scrollLeft;

        const isVScrollHidden = painter.canvas.offsetHeight >= table.height || table.rows.length === 0 || !isExpanded;
        const isHScrollHidden = Math.round(this.table.width - this.container.offsetWidth) === 0 || table.rows.length === 0 || !isExpanded;

        scrollVTrack.style.display = isVScrollHidden ? 'none' : 'block';
        scrollVBox.style.top = `${top}px`;

        scrollHTrack.style.display = isHScrollHidden ? 'none' : 'block';
        scrollHBox.style.left = `${left}px`;

        resizeBox.style.display = table.rows.length === 0 || !isExpanded ? 'none' : 'block';
    }

    protected updateExpandedState()
    {
        const { scrollVTrack, scrollHTrack } = this;

        scrollVTrack.style.display = this.isExpanded ? 'block' : 'none';
        scrollHTrack.style.display = this.isExpanded ? 'block' : 'none';

        this.painter.canvas.style.display = this.isExpanded ? 'block' : 'none';

        this.update();
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
