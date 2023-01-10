import Color from 'color';

import {  nextTick } from '../../core/util';
import { saveDevInspectorPrefs } from '../core/userPrefs';
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

    public isVisible: boolean;
    protected isMounted: boolean;

    protected renderRowMap?: Map<number, Row>;

    protected isExpanded: boolean;

    public static inspectors: Map<string, DevInspector<Record<string, any>>> = new Map();

    public static toggleExpanded()
    {
        const { inspectors } = DevInspector;
        const groupContainer = document.getElementById('dev-inspectors') as HTMLDivElement;
        const topInspector = inspectors.get(groupContainer.lastElementChild?.getAttribute('data-id') as string);
        const isExpanded = topInspector ? topInspector.isExpanded : false;

        for (const inspector of inspectors.values())
        {
            inspector.toggleExpandedState(!isExpanded);
        }
    }

    public static toggleVisible()
    {
        const { inspectors } = DevInspector;

        for (const inspector of inspectors.values())
        {
            inspector.toggleVisible();
        }
    }

    constructor(id: string, backgroundColor = 'blue')
    {
        this.id = id;
        this.painter = new Canvas2DPainter();
        this.painter.setBackgroundColor(backgroundColor);
        this.isExpanded = true;
        this.maxHeight = -1;
        this.scrollTop = 0;
        this.isMounted = false;
        this.isVisible = true;

        DevInspector.inspectors.set(id, this);

        const canvas = this.painter.canvas;

        const container = this.container = document.createElement('div');

        container.setAttribute('class', 'dev-inspector');
        container.setAttribute('data-id', id);

        container.innerHTML = `
            <label>
            <div class="toggle"><a title="Expand/Collapse">+</a></div>
            <span>${this.id}</span>
            <div class="inspect"><a title="Inspect (Shift-click to clear console)">?</a></div>
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

        const onMouseDown = (event: MouseEvent) =>
        {
            this.bringToFront();

            mouseDrag({
                startX: container.offsetLeft,
                startY: container.offsetTop,
                event,
            },
            ({ currentX, currentY }) =>
            {
                container.style.left = `${currentX}px`;
                container.style.top = `${currentY}px`;
            }).then(() =>
            {
                this.storeState();
            });
        };

        label.onmousedown = onMouseDown;

        toggleButton.onmousedown = (e: MouseEvent) =>
        {
            this.toggleExpandedState();
            this.bringToFront();

            e.stopPropagation();
        };

        inspectButton.onmousedown = (e: MouseEvent) =>
        {
            if (e.shiftKey)
            {
                console.clear();
            }

            this.inspect();
            e.stopPropagation();
        };

        canvas.onwheel = (e: WheelEvent) =>
        {
            const { deltaY } = e;
            const { scrollTop } = this;

            const yInc = deltaY !== 0 ? 1 : 0;
            const st = deltaY < 0 ? scrollTop - yInc : scrollTop + yInc;

            this.setScrollTop(st);
        };

        scrollVBox.onmousedown = (event: MouseEvent) =>
        {
            const startY = parseFloat(scrollVBox.style.top);
            const h = scrollVTrack.offsetHeight - scrollBoxThumbSize;

            event.stopPropagation();

            mouseDrag({
                startY,
                event,
            },
            ({ currentY }) =>
            {
                const top = Math.max(0, Math.min(currentY, h));
                const t = top / h;

                this.setScrollTop(Math.round(this.table.rows.length * t));
            });
        };

        container.onmousemove = (e: MouseEvent) =>
        {
            if (e.shiftKey)
            {
                if (!container.classList.contains('select'))
                {
                    container.classList.add('select');
                }
            }
            else
            if (container.classList.contains('select'))
            {
                container.classList.remove('select');
            }
        };

        canvas.onmousedown = (e: MouseEvent) =>
        {
            if (e.shiftKey)
            {
                const { renderRowMap } = this;

                if (renderRowMap)
                {
                    const { clientY } = e;
                    const bounds = canvas.getBoundingClientRect();
                    const y = clientY - bounds.top;

                    for (const [renderY, row] of renderRowMap.entries())
                    {
                        if (y >= renderY && y < renderY + this.table.rowHeight)
                        {
                            this.onClickRow(row);

                            break;
                        }
                    }
                }
            }
            else
            {
                onMouseDown(e);
            }
        };

        nextTick().then(() => this.init());
    }

    protected get groupContainer()
    {
        return document.getElementById('dev-inspectors') as HTMLDivElement;
    }

    protected getRowValue(row: Row): any | undefined
    {
        return row.get('$')?.value;
    }

    protected onClickRow(row: Row): any
    {
        const value = this.getRowValue(row);

        if (value)
        {
            console.log(value);
        }

        return value;
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

    public toggleExpandedState(isExpanded?: boolean)
    {
        this.isExpanded = isExpanded !== undefined ? isExpanded : !this.isExpanded;

        this.storeState();
        this.updateExpandedState();
    }

    public toggleVisible()
    {
        this.isVisible = !this.isVisible;

        if (this.isVisible)
        {
            this.container.classList.remove('hidden');
        }
        else
        {
            this.container.classList.add('hidden');
        }
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
        if (!this.isMounted)
        {
            return;
        }

        if (this.isExpanded)
        {
            const table = this.table = this.createTable();

            if (table.rows.length === 0)
            {
                this.painter.size(0, 0);
            }
            else
            {
                const { maxHeight } = this;
                const width = table.width;
                const height = maxHeight === -1
                    ? table.height
                    : Math.min(table.height, maxHeight + titleBarHeight + scrollBoxTrackSize);

                const { renderRowMap } = renderTable(table, this.painter, this.onCellStyle, width, height, 0, this.scrollTop);

                this.renderRowMap = renderRowMap;

                this.label.innerHTML = `${this.id} (${this.table.rows.length})`;

                this.updateScrollBars();
            }
        }
        else
        {
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
        this.scrollTop = 0;
        this.render();

        const left = this.container.offsetLeft;
        const top = this.container.offsetTop;

        if (left < 0)
        {
            this.container.style.left = '0px';
            this.storeState();
        }

        if (top < 0)
        {
            this.container.style.top = '0px';
            this.storeState();
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onCellStyle = (row: Row, column: Column, cellStyle: CellStyle): void =>
    {
        //
    };

    public mount()
    {
        this.groupContainer.appendChild(this.container);
        this.isMounted = true;
    }

    protected getCell(columnId: string, row: Row)
    {
        return row.get(columnId) as Cell;
    }

    protected bringToFront()
    {
        const { groupContainer } = this;

        groupContainer.removeChild(this.container);
        groupContainer.appendChild(this.container);

        saveDevInspectorPrefs();
    }
}
