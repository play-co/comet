import { Model } from './model';

export class VariantModel<M> extends Model<M>
{
    public nodeType(): string
    {
        return 'VariantModel';
    }
}
