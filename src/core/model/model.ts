import EventEmitter from 'eventemitter3';

import type { ClonableNode } from '../nodes/abstract/clonableNode';
import { GraphNode } from '../nodes/abstract/graphNode';
import { CloneMode } from '../nodes/cloneInfo';
import type { ModelSchema } from './schema';

export type ModelValue = string | number | boolean | object | null;
export interface ModelBase
{
    name: string;
    [key: string]: ModelValue;
}

export type ModelModifiedHandler = (key: string, value: ModelValue) => void;

export type ModelConstructor<M> = {
    new (owner: GraphNode, schema: ModelSchema<M>, data: Partial<M>, id?: string): Model<M>;
};

export class Model<M> extends GraphNode
{
    public readonly owner: GraphNode;
    public readonly schema: ModelSchema<M>;
    public readonly data: Partial<M>;
    public cloneMode: CloneMode;

    protected readonly emitter: EventEmitter<'modified'>;

    constructor(owner: GraphNode, schema: ModelSchema<M>, data: Partial<M>, id?: string)
    {
        super(id);

        this.owner = owner;
        this.schema = schema;
        this.data = data;
        this.children = [];
        this.cloneMode = CloneMode.Original;

        this.emitter = new EventEmitter();

        this.setValues(data);
    }

    public nodeType(): string
    {
        return 'Model';
    }

    public get isAsset()
    {
        return false;
    }

    public link(sourceModel: Model<M>, cloneMode: CloneMode = CloneMode.Original)
    {
        this.parent = sourceModel;
        this.cloneMode = cloneMode;

        sourceModel.children.push(this);
    }

    public get values(): M
    {
        const { schema: { keys, keys: { length: l } } } = this;
        const values: M = {} as M;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i] as keyof M;

            values[key] = this.getValue(key);
        }

        return values;
    }

    public get ownValues(): M
    {
        return {
            ...this.data,
        } as M;
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getOwner(key: keyof M): ClonableNode
    {
        return this.owner.cast<ClonableNode>();
    }

    public getValue<T extends M[keyof M]>(key: keyof M): T
    {
        const { data, parent, schema: { properties } } = this;
        const value = (data as M)[key];

        if (value === undefined)
        {
            // for undefined values (note: use null in model for "no value", undefined is reserved
            if (parent)
            {
                // lookup parents value
                return (parent as Model<M>).getValue(key);
            }

            // return default value if no parent and no own value
            return properties[key].defaultValue as T;
        }

        // return own value
        return value as T;
    }

    public setValue<K extends keyof M>(key: K, newValue: M[K])
    {
        const { data, schema } = this;
        const propDesc = schema.properties[key];
        const constraints = schema.getConstraints(key);

        if (newValue === propDesc.defaultValue)
        {
            // don't set default values to optimise storage
            return;
        }

        let value = newValue;

        if (constraints)
        {
            constraints.forEach((constraint) =>
            {
                // apply each constraint to the value
                value = constraint.applyToValue(value, String(key), this);
            });
        }

        // set own value and notify listeners
        Reflect.set(data, key, value);

        this.notifyModified(key, value as M[keyof M]);
    }

    public setValues(values: Partial<M>)
    {
        const { ownValues } = this;
        const keys = Object.getOwnPropertyNames(values) as (keyof M)[];
        const prevValues: Partial<M> = {};

        // for each key call this.setValue and return the previous values
        keys.forEach((key) =>
        {
            const value = values[key] as M[keyof M];

            prevValues[key] = ownValues[key];
            this.setValue(key, value);
        });

        return prevValues;
    }

    public flatten()
    {
        if (this.parent)
        {
            const { schema: { keys, keys: { length: l }, properties } } = this;

            for (let i = 0; i < l; i++)
            {
                const key = keys[i] as keyof M;

                const value = this.getValue(key);

                if (value !== properties[key].defaultValue)
                {
                    (this.data as M)[key] = value;
                }
            }

            this.parent.removeChild(this);
        }
    }

    public clone<T extends Model<M>>(owner: GraphNode): T
    {
        return createModel(this.constructor as ModelConstructor<M>, owner, this.schema, this.ownValues) as unknown as T;
    }

    public reset()
    {
        const { schema: { keys, keys: { length: l } } } = this;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i] as keyof M;

            delete this.data[key];
        }

        this.emitter.emit('modified');
    }

    protected notifyModified(key: keyof M, value: M[keyof M] | undefined): void
    {
        this.emitter.emit('modified', key, value);

        this.forEach<Model<any>>((childModel) => childModel.notifyModified(key, value));
    }

    public bind(handler: ModelModifiedHandler)
    {
        this.emitter.on('modified', handler);
    }

    public unbind(handler: ModelModifiedHandler)
    {
        this.emitter.off('modified', handler);
    }
}

export function createModel<M>(
    Ctor: ModelConstructor<M>,
    owner: GraphNode,
    schema: ModelSchema<M>,
    values: Partial<M> = {},
    id?: string,
): Model<M> & M
{
    const { keys } = schema;

    const model = new Ctor(owner, schema, values, id) as Model<M> & M;

    keys.forEach((k) =>
    {
        const key = k as keyof M;

        Object.defineProperty(model, key, {
            get()
            {
                return this.getValue(key) as M[keyof M];
            },
            set<K extends keyof M>(newValue: M[K])
            {
                return model.setValue(key, newValue);
            },
        });

        if (values[key] !== undefined)
        {
            model.setValue(key, values[key] as M[keyof M]);
        }
    });

    return model;
}
