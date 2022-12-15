import Color from 'color';

export const logSources: Record<string, Color> = {
    app: Color('purple'),
    datastore: Color('green'),
    nodeFactory: Color('blue'),
    command: Color('green'),
} as const;

export type LogSource = keyof typeof logSources;

export function logColor(source: LogSource)
{
    return logSources[source];
}

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
