import EventEmitter from 'eventemitter3';

import type schema from '../schema';
import { getVisibleProperties } from '../typeUtil';

type NodeCtor = {
    new (): BaseNode;
    nodeName: string;
};

export class BaseNode extends EventEmitter<'get' | 'set'>
{
    public $baseVisibleProp: string;
    public baseProp: string;

    constructor()
    {
        super();

        this.$baseVisibleProp = 'baseVisiblePropDefault';
        this.baseProp = 'basePropDefault';
    }

    public create<T extends BaseNode>(/** todo: props */): T
    {
        const Ctor = Object.getPrototypeOf(this).constructor as NodeCtor;
        const instance = new Ctor();
        const name = Ctor.name as keyof typeof schema.definitions;
        const publicProperties = getVisibleProperties(name);

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

    public foo()
    {
        return 'foo';
    }
}
