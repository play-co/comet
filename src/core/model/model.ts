import { type GraphNodeEvents, GraphNode } from '../nodes/abstract/graphNode';
import { newId } from '../nodes/instances';
import type { ModelSchema } from './schema';

export type ModelValue = string | number | boolean | object | null;
export type ModelBase = Record<string, ModelValue>;

export class Model<M> extends GraphNode<GraphNodeEvents | 'modified'>
{
    public schema: ModelSchema<M>;
    public data: Partial<M>;

    public isReference: boolean;

    constructor(schema: ModelSchema<M>, data: Partial<M>)
    {
        super(newId('Model'));

        this.schema = schema;
        this.data = data;
        this.children = [];
        this.isReference = false;

        this.setValues(data);
    }

    public link(sourceModel: Model<M>)
    {
        this.parent = sourceModel;
        sourceModel.children.push(this);
    }

    public get values(): M
    {
        const { schema: { keys, keys: { length: l } } } = this;
        const values: M = {} as M;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i] as keyof M;

            const value = this.getValue(key);

            values[key] = value;
        }

        return values;
    }

    public get ownValues(): M
    {
        const { data, schema: { keys, keys: { length: l } } } = this;
        const values: M = {} as M;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i] as keyof M;

            const value = (data as unknown as M)[key];

            if (value !== undefined)
            {
                values[key] = value;
            }
        }

        return values;
    }

    public getValue(key: keyof M): M[keyof M]
    {
        const { data, parent, schema: { defaults } } = this;

        const value = (data as M)[key];

        if (value === undefined)
        {
            if (parent)
            {
                return (parent as Model<any>).getValue(key) as M[keyof M];
            }

            return defaults[key];
        }

        return value;
    }

    public setValue<K extends keyof M>(key: K, newValue: M[K])
    {
        const { data, schema, schema: { keys } } = this;

        let oldValue = Reflect.get(data, key);

        if (oldValue === undefined)
        {
            oldValue = this.getValue(key);
        }

        let value = newValue === undefined ? data[key] : newValue;

        const constraints = schema.getConstraints(key);

        if (constraints)
        {
            constraints.forEach((constraint) =>
            {
                value = constraint.applyToValue(value, String(key), this);
            });
        }

        const rtn = Reflect.set(data, key, value);

        if (keys.indexOf(String(key)) > -1)
        {
            this.onModified(key, value as M[keyof M], oldValue as unknown as M[keyof M]);
        }

        return rtn;
    }

    public rawSetValue<T>(key: keyof M, newValue: T)
    {
        const { data, schema: { keys } } = this;

        let oldValue = Reflect.get(data, key) as T;

        if (oldValue === undefined)
        {
            oldValue = this.getValue(key) as unknown as T;
        }

        const value = newValue === undefined ? data[key] : newValue;

        const rtn = Reflect.set(data, key, value);

        if (keys.indexOf(String(key)) > -1)
        {
            this.emit('modified', key, value, oldValue);

            this.children.forEach((childModel) => (childModel as Model<any>).rawSetValue(key, value));
        }

        return rtn;
    }

    public setValues(values: Partial<M>)
    {
        const keys = Object.getOwnPropertyNames(values) as (keyof M)[];
        const prevValues: Partial<M> = {};

        keys.forEach((key) =>
        {
            const value = values[key] as M[keyof M];

            if (value !== this.schema.defaults[key])
            {
                prevValues[key] = this.ownValues[key];
                this.setValue(key, value);
            }
        });

        return prevValues;
    }

    public clearValue(key: keyof M)
    {
        const oldValue = this.ownValues[key];

        delete this.data[key];
        this.onModified(key, undefined, oldValue);
    }

    public flatten()
    {
        if (this.parent)
        {
            const { schema: { keys, keys: { length: l }, defaults } } = this;

            for (let i = 0; i < l; i++)
            {
                const key = keys[i] as keyof M;

                const value = this.getValue(key);

                if (value !== defaults[key])
                {
                    (this.data as M)[key] = value;
                }
            }

            this.parent.removeChild(this);
        }
    }

    public clone<T extends Model<M>>(): T
    {
        return createModel(this.schema, this.ownValues) as unknown as T;
    }

    public reset()
    {
        const { schema: { keys, keys: { length: l } } } = this;

        for (let i = 0; i < l; i++)
        {
            const key = keys[i] as keyof M;

            delete this.data[key];
        }

        this.emit('modified');
    }

    public onModified(key: keyof M, value: M[keyof M] | undefined, oldValue: M[keyof M]): void
    {
        this.emit('modified', key, value, oldValue);

        this.forEach<Model<any>>((childModel) => childModel.onModified(key, value, oldValue));
    }

    public getReferenceParent(): Model<M> | undefined
    {
        if (this.isReference)
        {
            if (this.parent)
            {
                return this.getParent<Model<any>>().getReferenceParent();
            }

            return this;
        }

        return undefined;
    }

    public nodeType(): string
    {
        return 'Model';
    }
}

export function createModel<M>(
    schema: ModelSchema<M>,
    values: Partial<M> = {},
): Model<M> & M
{
    const { keys } = schema;

    const model = new Model(schema, values) as Model<M> & M;

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
