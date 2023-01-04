import type { ModelConstraint } from './constraints';

export type PropertyCategory =
| 'node'
| 'transform'
| 'display'
| 'asset'
| 'texture'
| 'text';

export interface PropertyDescriptor<M>
{
    defaultValue: M[keyof M];
    category: PropertyCategory;
    constraints?: ModelConstraint<any>[];
    ownValue?: boolean;
}

export type PropertyDescriptors<M> = Record<keyof M, PropertyDescriptor<M>>;

export class ModelSchema<M>
{
    public keys: string[];
    public properties: PropertyDescriptors<M>;

    constructor(properties: PropertyDescriptors<M>)
    {
        this.keys = Object.getOwnPropertyNames(properties);
        this.properties = properties;
    }

    public getConstraints(key: keyof M)
    {
        const array: ModelConstraint<any>[] = [];
        const constraints = this.properties[key].constraints;

        if (constraints)
        {
            array.push(...constraints);
        }

        return array;
    }
}
