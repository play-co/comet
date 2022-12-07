export type LogSource =
| 'datastore';

interface LogEntry
{
    timestamp: number;
    source: LogSource;
    data: any[];
}

export const logEntries: LogEntry[] = [];

export function log(source: LogSource, ...data: any[])
{
    logEntries.push({
        timestamp: Date.now(),
        source,
        data,
    });
}
