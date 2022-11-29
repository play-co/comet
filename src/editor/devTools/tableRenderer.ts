import Canvas2DPainter, { measureText } from './2dPainter';

interface Column
{
    id: string;
    width: number;
}

type Row = Map<string, string>;

interface Table
{
    columns: Column[];
    rows: Row[];
    width: number;
    height: number;
    rowHeight: number;
}

const fontSize = 14;
const indexKey = 'index';
const hPad = 3;

export function createTable<T extends Record<string, any>>(data: Record<string, T> | T[], rowHeight = 20): Table
{
    const indexColumn: Column = {
        id: indexKey,
        width: 0,
    };
    const columns: Column[] = [indexColumn];
    const rows: Row[] = [];
    const columnsById: Map<string, Column> = new Map();

    columnsById.set(indexKey, indexColumn);

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

            row.set(key, JSON.stringify(value));
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

            row.set(indexKey, String(i));
        });
    }
    else
    {
        for (const [key, value] of Object.entries(data))
        {
            const row = registerFields(value);

            row.set(indexKey, key);
        }
    }

    // detect sizes

    const cellSize = measureText(indexKey, fontSize);

    indexColumn.width = cellSize.width;

    rows.forEach((row) =>
    {
        for (const columnId of row.keys())
        {
            const column = columnsById.get(columnId) as Column;
            const cellSize = measureText(JSON.stringify(row.get(columnId)), fontSize);
            const columnHeadingSize = measureText(columnId, fontSize);

            column.width = Math.max(cellSize.width, column.width, columnHeadingSize.width);
        }
    });

    let tableWidth = 0;

    columns.forEach((column) =>
    {
        tableWidth += column.width;
    });

    return {
        width: tableWidth,
        height: rowHeight * (rows.length + 1),
        columns,
        rows,
        rowHeight,
    };
}

export function renderTable(table: Table)
{
    console.log(table);

    const { rowHeight, columns, rows } = table;
    const painter = new Canvas2DPainter(table.width, table.height, 'blue');
    let x = 0;
    let y = 0;

    painter.fillColor('white');

    const drawCell = (text: string, x: number, y: number, columnWidth: number) =>
    {
        const textInfo = measureText(text, fontSize);

        painter
            .drawText(text, x + ((columnWidth - textInfo.width) * 0.5) + hPad, y + ((rowHeight - textInfo.height) * 0.5) + (fontSize * 0.75))
            .line(x + columnWidth, y, x + columnWidth, y + rowHeight);
    };

    // render column headers

    columns.forEach((column) =>
    {
        painter
            .strokeColor('#ccc')
            .fillColor('darkblue')
            .fillRect(x, y, x + column.width, y + rowHeight)
            .fillColor('white');

        drawCell(column.id, x, y, column.width);

        x += column.width;
    });

    painter.line(0, y + rowHeight, table.width, y + rowHeight);

    y += rowHeight;

    // render rows

    rows.forEach((row) =>
    {
        x = 0;

        columns.forEach((column) =>
        {
            painter
                .strokeColor('#ccc')
                .fillColor('white');

            drawCell(String(row.get(column.id)), x, y, column.width);

            x += column.width;
        });

        painter.line(0, y + rowHeight, table.width, y + rowHeight);

        y += rowHeight;
    });

    // show canvas
    const canvas = painter.canvas;

    canvas.style.cssText = `
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 1000;
    border: 1px solid white;
    `;

    document.body.appendChild(canvas);
}
