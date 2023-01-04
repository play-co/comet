import Color from 'color';

import { nextTick } from '../../../core/util';
import { Application } from '../../core/application';
import Events from '../../events';
import { DevInspector } from '../devInspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from '../tableRenderer';

interface UndoStackDetail
{
    name: string;
}

export class UndoStackInspector extends DevInspector<UndoStackDetail>
{
    protected init(): void
    {
        const onUpdate = () =>
        {
            nextTick().then(() => this.scrollToEnd());
        };

        Events.command.exec.bind(onUpdate);
        Events.command.undo.bind(onUpdate);
        Events.command.redo.bind(onUpdate);

        this.render();
    }

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

    public onCellStyle = (row: Row, column: Column, cellStyle: CellStyle) =>
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

        if (column.id === tableIndexKey)
        {
            cellStyle.text = String(parseInt(cellStyle.text.replace(/"/g, ''), 10));
        }
    };

    protected inspect()
    {
        const undoStack = Application.instance.undoStack;

        console.log(undoStack.length, undoStack.stack);
    }

    protected indexColumnLabel()
    {
        return 'index';
    }
}
