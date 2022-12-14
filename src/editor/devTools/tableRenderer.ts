import Color from 'color';

import type Canvas2DPainter from './2dPainter';
import { type FontStyle, measureText } from './2dPainter';

export interface Column
{
    id: string;
    width: number;
}

export interface Cell
{
    value: any;
}

export type Row = Map<string, Cell>;

export interface Table
{
    indexColumnLabel: string;
    columns: Column[];
    rows: Row[];
    width: number;
    height: number;
    rowHeight: number;
    fontSize: number;
}

export const tableIndexKey = '$$index';

function stringify(value: any)
{
    if (value === undefined)
    {
        return 'undefined';
    }
    else if (value === null)
    {
        return 'null';
    }
    else if (typeof value === 'string')
    {
        return value;
    }

    return JSON.stringify(value).replace(/^\{|\}$/g, '');
}

export function createTable<T extends Record<string, any>>(
    data: Record<string, T> | T[],
    indexColumnLabel: string,
    fontSize: number,
    rowHeight = 17,
): Table
{
    const indexColumn: Column = {
        id: tableIndexKey,
        width: 0,
    };
    const columns: Column[] = [indexColumn];
    const rows: Row[] = [];
    const columnsById: Map<string, Column> = new Map();

    columnsById.set(tableIndexKey, indexColumn);

    const registerFields = (item: T) =>
    {
        const row: Row = new Map();

        for (const [key, value] of Object.entries(item))
        {
            if (!columnsById.has(key))
            {
                const column: Column = {
                    id: key,
                    width: 0,
                };

                columns.push(column);
                columnsById.set(key, column);
            }

            row.set(key, {
                value,
            });
        }

        rows.push(row);

        return row;
    };

    // collect fields
    if (Array.isArray(data))
    {
        data.forEach((item, i) =>
        {
            const row = registerFields(item);

            row.set(tableIndexKey, {
                value: String(i),
            });
        });
    }
    else
    {
        for (const [key, value] of Object.entries(data))
        {
            const row = registerFields(value);

            row.set(tableIndexKey, {
                value: key,
            });
        }
    }

    // detect sizes
    const cellSize = measureText(tableIndexKey, fontSize);

    indexColumn.width = cellSize.width;

    rows.forEach((row) =>
    {
        for (const columnId of row.keys())
        {
            const column = columnsById.get(columnId) as Column;

            if (columnId.charAt(0) === '_' || columnId === '$')
            {
                column.width = 0;
                continue;
            }

            const value = row.get(columnId)?.value;

            if (value)
            {
                const cellSize = measureText(stringify(value), fontSize);

                column.width = Math.max(cellSize.width, column.width);
            }
        }
    });

    let tableWidth = 0;

    columns.forEach((column, i) =>
    {
        const columnHeadingSize = measureText(column.id, fontSize);

        column.width = Math.max(column.width, columnHeadingSize.width) + (i === columns.length - 1 ? 30 : 15);

        if (column.id.charAt(0) !== '_' && column.id !== '$')
        {
            tableWidth += column.width;
        }
    });

    return {
        indexColumnLabel,
        width: tableWidth,
        height: rowHeight * (rows.length + 1),
        columns,
        rows,
        rowHeight,
        fontSize,
    };
}

export interface CellStyle
{
    text: string;
    fillColor: string;
    fontColor: string;
    fontStyle: FontStyle;
}

export function renderTable(
    table: Table,
    painter: Canvas2DPainter,
    cellStyleFn: (row: Row, column: Column, cellStyle: CellStyle) => string | void,
    width: number,
    height: number,
    scrollLeft: number,
    scrollTop: number,
)
{
    const { rowHeight, columns, rows, fontSize, indexColumnLabel } = table;
    const w = width > -1 ? width : table.width;
    const h = height > -1 ? Math.min(height, table.height) : table.height;
    let x = 0;
    let y = 0;

    const renderRowMap: Map<number, Row> = new Map();

    painter
        .size(w, h)
        .clear()
        .resetTransform()
        .fontColor('white')
        .translate(-scrollLeft, 0);

    const drawCell = (cellStyle: CellStyle, x: number, y: number, columnWidth: number) =>
    {
        const textInfo = measureText(cellStyle.text, fontSize);
        const left = x + 5;

        painter
            .fontColor(cellStyle.fontColor)
            .fontStyle(cellStyle.fontStyle)
            .save()
            .clip(x, y, columnWidth, rowHeight)
            .drawText(cellStyle.text, left, y + textInfo.height + ((rowHeight - textInfo.height) * 0.5))
            .restore()
            .line(x + columnWidth, y, x + columnWidth, y + rowHeight);
    };

    // render column headers
    columns.forEach((column) =>
    {
        if (column.id.charAt(0) === '_' || column.id === '$')
        {
            return;
        }

        const cellStyle: CellStyle = {
            text: column.id === tableIndexKey ? indexColumnLabel : column.id,
            fillColor: Color(painter.backgroundColor).darken(0.5).hex(),
            fontColor: 'white',
            fontStyle: 'bold',
        };

        painter
            .fontStyle(cellStyle.fontStyle)
            .strokeColor(cellStyle.fontColor)
            .fillColor(cellStyle.fillColor)
            .fillRect(x + 1, y + 1, x + column.width - 2, y + rowHeight - 2);

        drawCell(cellStyle, x, y, column.width);

        x += column.width;
    });

    painter.line(0, y + rowHeight, w, y + rowHeight);

    y += rowHeight;

    // render rows

    for (let i = scrollTop; i < rows.length; i++)
    {
        const row = rows[i];

        x = 0;

        renderRowMap.set(y, row);

        for (const column of columns)
        {
            if (column.id.charAt(0) === '_' || column.id === '$')
            {
                continue;
            }

            const cell = row.get(column.id) as Cell;

            painter
                .fontStyle('normal')
                .strokeColor('#999');

            const cellStyle: CellStyle = {
                text: stringify(cell.value),
                fillColor: painter.backgroundColor,
                fontColor: 'white',
                fontStyle: 'normal',
            };

            cellStyleFn(row, column, cellStyle);

            painter
                .fillColor(cellStyle.fillColor)
                .fillRect(x + 1, y + 1, x + column.width - 2, y + rowHeight - 2);

            drawCell(cellStyle, x, y, column.width);

            x += column.width;
        }

        painter.line(0, y + rowHeight, table.width, y + rowHeight);

        y += rowHeight;

        if (y > h)
        {
            break;
        }
    }

    return {
        renderRowMap,
    };
}
