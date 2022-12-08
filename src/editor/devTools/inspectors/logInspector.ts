import Color from 'color';

import { type LogEntry, type LogSource, getLogEntries, onLog } from '../../../core/log';
import { DevInspector } from '../devInspector';
import { type CellStyle, type Column, type Row, tableIndexKey } from '../tableRenderer';

const logSourceColor = new Map<LogSource, Color>();

logSourceColor.set('datastore', Color('cyan'));
logSourceColor.set('nodeFactory', Color('blue'));
logSourceColor.set('command', Color('green'));

export class LogInspector extends DevInspector<Omit<LogEntry, 'timestamp'>>
{
    protected init(): void
    {
        onLog(() =>
        {
            this.render();
        });

        setTimeout(() => this.render(), 0);
    }

    protected getDetails()
    {
        const logEntries = getLogEntries();
        const details: Record<string, Omit<LogEntry, 'timestamp'>> = {};

        for (const logEntry of logEntries)
        {
            const entry = {
                source: logEntry.source,
                eventName: logEntry.eventName,
                data: logEntry.data,
            };

            details[logEntry.timestamp] = entry;
        }

        return details;
    }

    public onCellStyle = (row: Row, column: Column, cellStyle: CellStyle) =>
    {
        const currentCell = this.getCell(column.id, row);

        if (column.id === 'source')
        {
            cellStyle.fillColor = (logSourceColor.get(currentCell.value) as Color).darken(0.5).hex();
        }
        else if (column.id === 'eventName')
        {
            cellStyle.fontStyle = 'bold';
        }

        if (column.id === tableIndexKey)
        {
            const d = new Date(parseInt(currentCell.value, 10));

            cellStyle.text = `${d.toTimeString().split(' ')[0]}.${d.getMilliseconds()}`;
        }
        else if (column.id === 'data')
        {
            cellStyle.text = JSON.stringify(currentCell.value);
        }
    };

    protected inspect()
    {
        const logEntries = getLogEntries();

        console.log(logEntries);
    }

    protected indexColumnLabel()
    {
        return 'time';
    }
}
