import Color from 'color';

import { Application } from '../core/application';
import { DevInspector } from './inspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from './tableRenderer';

interface UndoStackDetail
{
    name: string;
}

export class UndoStackInspector extends DevInspector<UndoStackDetail>
{
    protected getDetails()
    {
        const undoStack = Application.instance.undoStack;
        const details: UndoStackDetail[] = [];

        undoStack.stack.forEach((command) =>
        {
            const detail: UndoStackDetail = {
                name: command.name,
            };

            details.push(detail);
        });

        return details;
    }

    public onCellStyle = (row: Row, _column: Column, cellStyle: CellStyle) =>
    {
        const undoStack = Application.instance.undoStack;
        const indexCell = this.getCell(tableIndexKey, row);
        const index = parseInt(indexCell.value, 10);

        if (index === undoStack.head)
        {
            cellStyle.fillColor = Color(this.painter.backgroundColor).lighten(0.5).hex();
            cellStyle.fontColor = 'white';
            cellStyle.fontStyle = 'bold';
        }
    };

    protected inspect()
    {
        const undoStack = Application.instance.undoStack;

        console.log(undoStack.stack);
    }
}
