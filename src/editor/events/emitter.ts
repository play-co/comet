import EventEmitter from 'eventemitter3';

const internalEventToken = '*';

export class TypedEmitter<T>
{
    private readonly emitter: EventEmitter;
    public eventName = '';

    constructor()
    {
        this.emitter = new EventEmitter();
    }

    public bind(callback: (data: T) => void)
    {
        this.emitter.on(internalEventToken, callback);

        return this;
    }

    public unbind(callback: (data: T) => void)
    {
        this.emitter.off(internalEventToken, callback);

        return this;
    }

    public emit(data: T)
    {
        this.emitter.emit(internalEventToken, data);
    }

    public get type(): T
    {
        return {} as T;
    }
}

export function Emit<T>()
{
    return new TypedEmitter<T>();
}

export function EventMap<T extends object>(events: T)
{
    function walk(obj: object): void
    {
        for (const [key, value] of Object.entries(obj))
        {
            if (typeof value === 'object')
            {
                walk(value);
            }
            else if (value instanceof TypedEmitter)
            {
                const emitter = value as TypedEmitter<unknown>;

                emitter.eventName = key;
            }
        }
    }

    walk(events);

    return events;
}

