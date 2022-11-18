import EventEmitter from 'eventemitter3';

import { getUserLogColor, getUserName } from '../../editor/sync/user';

let showStackFile = false;

export function setShowStackFile(bool: boolean)
{
    showStackFile = bool;
}

const userName = getUserName();
const userColor = getUserLogColor(userName);
const logId = `${userName}`;
const logStyle1 = 'color:Goldenrod';
const logStyle2 = 'color:DarkGray';

const emitter: EventEmitter = new EventEmitter();

function formatStack(error: Error)
{
    const stack = error.stack;
    let wasError = false;

    if (stack)
    {
        try
        {
            const lines = stack.split('\n');
            let line = lines[2].trim().replace(/^at /, '');
            const method = (/at [^ ]+/).exec(line);
            const file = (/\([^)]+\)/).exec(line);
            const stackFile = file ? file[0] : '?';
            const host = `${window.location.protocol}//${window.location.host}`;

            if (line.indexOf(host) === 0)
            {
                line = line.replace(host, '');
            }

            if (showStackFile)
            {
                return `${method ?? line}:${stackFile}`;
            }

            return method ?? line;
        }
        catch (e)
        {
            wasError = true;
        }
    }

    return `<stack unavailable${wasError ? ' (parse error)' : ''}>`;
}

// debug logging
(emitter as any).emit = function emit(event: string, ...args: any[])
{
    // const error = new Error();

    // console.log(`%c${logId}:%c🔆"${event}" %c${formatStack(error)}`, userColor, logStyle1, logStyle2);
    EventEmitter.prototype.emit.apply(emitter, [event, ...args]);
};

export type EventDeclaration = Record<string, object>;

export function getGlobalEmitter<T>()
{
    type K = keyof T extends string ? keyof T : never;

    return emitter as unknown as Omit<EventEmitter<K>, 'emit'> & {
        emit: <E extends keyof T>(event: E, payload?: T[E]) => boolean;
    };
}

export function log(...args: any[])
{
    const error = new Error();

    const output = JSON.stringify(args)
        .replace(/^\[/, '')
        .replace(/\]$/, '');

    console.log(`%c${logId}:%cℹ️ ${output} %c${formatStack(error)}`, userColor, logStyle1, logStyle2);
}
