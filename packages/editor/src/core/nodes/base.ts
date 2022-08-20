import EventEmitter from 'eventemitter3';
import type schema from 'src/core/schema';
import { getPublicProperties } from 'src/core/typeUtil';

type NodeCtor = {
    new (): BaseNode;
    name: string;
};

export class BaseNode extends EventEmitter<'get' | 'set'>
{
    public baseProp: string;
    public _basePrivate: string;

    constructor()
    {
        super();

        this.baseProp = 'baseDefault';
        this._basePrivate = 'basePrivateDefault';
    }

    public create<T extends BaseNode>(/** todo: props */): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as NodeCtor;
        const instance = new Ctor();
        const name = Ctor.name as keyof typeof schema.definitions;
        const publicProperties = getPublicProperties(name);

        const handler = {
            get<T>(target: BaseNode, key: string): T
            {
                const result = Reflect.get(target, key);

                if (publicProperties.indexOf(key) > -1)
                {
                    instance.emit('get', key, result);
                }

                return result as T;
            },
            set<T>(target: BaseNode, key: string, value: T)
            {
                if (publicProperties.indexOf(key) > -1)
                {
                    instance.emit('set', key, value);
                }

                return Reflect.set(target, key, value);
            },
        };

        const proxy: T = new Proxy(instance, handler) as T;

        return proxy;
    }
}
