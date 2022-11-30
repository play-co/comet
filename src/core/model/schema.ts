import type { ModelConstraint, ModelConstraints } from './constraints';

export type PropertyCategory =
| 'Transform'
| 'Display'
| 'Texture'
| 'Text';

export interface PropertyDescriptor<M>
{
    defaultValue: M[keyof M];
    category: PropertyCategory;
}

export type PropertyDescriptors<M> = Record<keyof M, PropertyDescriptor<M>>;

export class ModelSchema<M>
{
    public keys: string[];
    public properties: PropertyDescriptors<M>;
    public constraints: ModelConstraints<M>;

    constructor(properties: PropertyDescriptors<M>, constraints: ModelConstraints<M> = {})
    {
        this.keys = Object.getOwnPropertyNames(properties);
        this.properties = properties;
        this.constraints = constraints;
    }

    public getConstraints(key: keyof M)
    {
        const array: ModelConstraint<any>[] = [];

        if (this.constraints['*'])
        {
            array.push(...this.constraints['*']);
        }

        if (this.constraints[key])
        {
            const constraints = this.constraints[key] as ModelConstraint<any>[];

            array.push(...constraints);
        }

        return array;
    }
}
