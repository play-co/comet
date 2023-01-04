import type { Model } from './model';

export abstract class ModelConstraint<T>
{
    public abstract applyToValue(value: T | undefined, key: string, model: Model<any>): T | undefined;
}

export type ModelConstraints<
    M> = Partial<Record<keyof M, ModelConstraint<any>[]>
    >;

export class NumericRangeLimitConstraint extends ModelConstraint<number>
{
    public min: number;
    public max: number;

    constructor(min: number, max: number)
    {
        super();

        this.min = min;
        this.max = max;
    }

    public applyToValue(value: number): number
    {
        const { min, max } = this;

        return Math.min(max, Math.max(min, value));
    }
}
