import EventEmitter from 'eventemitter3';

export class TypedEmitter<T>
{
    private readonly emitter: EventEmitter;

    constructor()
    {
        this.emitter = new EventEmitter();
    }

    public bind(callback: (data: T) => void)
    {
        this.emitter.on('event', callback);

        return this;
    }

    public emit(data: T)
    {
        this.emitter.emit('event', data);
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
