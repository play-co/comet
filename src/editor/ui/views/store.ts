import EventEmitter from 'eventemitter3';
import { type Unsubscriber, type Writable, get, writable } from 'svelte/store';

export class WritableStore<T> extends EventEmitter<'change'>
{
    public readonly store: Writable<T>;
    private readonly unsubscriber: Unsubscriber;

    constructor(defaultValue: T)
    {
        super();

        this.store = writable(defaultValue);
        this.unsubscriber = this.store.subscribe((value) => this.emit('change', value));
    }

    get value()
    {
        return get(this.store);
    }

    set value(value: T)
    {
        this.store.set(value);
    }

    public unsubscribe()
    {
        this.unsubscriber();
    }
}
