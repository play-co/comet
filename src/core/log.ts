export type LogSource =
| 'datastore'
| 'nodeFactory'
| 'command';

export interface LogEntry
{
    timestamp: number;
    source: LogSource;
    eventName: string;
    data: any[];
}

let isLogEnabled = false;

export function enableLog()
{
    isLogEnabled = true;
}

const logEntries: LogEntry[] = [];

export function getLogEntries()
{
    return logEntries;
}

let onLogHandler: (logEntry: LogEntry) => void | undefined;

export function onLog(handler: (logEntry: LogEntry) => void)
{
    onLogHandler = handler;
}

export function log(source: LogSource, eventName: string, ...data: any[])
{
    if (isLogEnabled)
    {
        const logEntry = {
            timestamp: Date.now(),
            source,
            eventName,
            data,
        };

        logEntries.push(logEntry);

        if (onLogHandler)
        {
            onLogHandler(logEntry);
        }
    }
}
