import { Model } from './model';

export class OriginalModel<M> extends Model<M>
{
    public nodeType(): string
    {
        return 'OriginalModel';
    }
}
