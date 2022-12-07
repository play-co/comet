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

type GlobalCallback = (eventName: string, ...args: any[]) => void;
type Filter = {eventNameFilter: string; callback: GlobalCallback};

export function EventMap<T extends object>(events: T): T & {
    $: (eventNameFilter: string, callback: GlobalCallback) => void;
}
{
    const filters: Filter[] = [];

    function walk(obj: object, path = ''): void
    {
        for (const [key, value] of Object.entries(obj))
        {
            const keyPath = path.length === 0 ? key : `${path}.${key}`;

            if (value instanceof TypedEmitter)
            {
                const typedEmitter = (value as TypedEmitter<unknown>);

                typedEmitter.eventName = keyPath;
                typedEmitter.bind((...data: any[]) =>
                {
                    for (const filter of filters)
                    {
                        if (filter.eventNameFilter === '*' || RegExp(filter.eventNameFilter).exec(keyPath))
                        {
                            filter.callback(keyPath, ...data);
                        }
                    }
                });
            }
            else
            {
                walk(value, keyPath);
            }
        }
    }

    walk(events);

    return {
        ...events,
        $(eventNameFilter: string, callback: GlobalCallback)
        {
            filters.push({ eventNameFilter, callback });
        },
    };
}
