import type { ClonableNode } from '../nodes/abstract/clonableNode';
import { Model } from './model';

export class ReferenceModel<M> extends Model<M>
{
    public nodeType(): string
    {
        return 'ReferenceModel';
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getOwner(key: keyof M)
    {
        if (this.parent)
        {
            return this.getParent<Model<M>>().owner.cast<ClonableNode>();
        }

        throw new Error(`ReferenceModel ${this.id} has no owner.`);
    }
}
