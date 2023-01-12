import type { ClonableNode } from '../nodes/abstract/clonableNode';
import { Model } from './model';

export class ReferenceRootModel<M> extends Model<M>
{
    public nodeType(): string
    {
        return 'ReferenceRootModel';
    }

    public setValue<K extends keyof M>(key: K, newValue: M[K])
    {
        const propDesc = this.schema.properties[key];

        if (propDesc.isRootValue === true)
        {
            super.setValue(key, newValue);
        }
        else if (this.parent)
        {
            this.getParent<Model<M>>().setValue(key, newValue);
        }
    }

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getOwner(key: keyof M)
    {
        const propDesc = this.schema.properties[key];

        if (propDesc.isRootValue === true)
        {
            return this.owner.cast<ClonableNode>();
        }

        if (this.parent)
        {
            return this.getParent<Model<M>>().owner.cast<ClonableNode>();
        }

        throw new Error(`ReferenceRootModel ${this.id} has no owner.`);
    }
}
